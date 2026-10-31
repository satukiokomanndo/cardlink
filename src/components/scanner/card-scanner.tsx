'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Camera, Upload, Loader2, Check, Edit } from 'lucide-react'

interface OCRResult {
  name: string
  name_kana: string
  company_name: string
  department: string
  position: string
  email: string
  phone: string
  mobile: string
  postal_code: string
  address: string
  website: string
}

export function CardScanner() {
  const router = useRouter()
  const { toast } = useToast()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (file: File) => {
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
  }

  async function performOCR() {
    if (!image) return
    setScanning(true)
    try {
      // Tesseract.js を使ったクライアントサイドOCR
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(['jpn', 'eng'])
      const { data } = await worker.recognize(image)
      await worker.terminate()

      const text = data.text
      const extracted = extractCardInfo(text)
      setResult(extracted)
      toast({ title: 'OCR完了', description: '認識結果を確認して編集してください' })
    } catch (error) {
      console.error('OCR error:', error)
      toast({ title: 'OCRエラー', description: '文字認識に失敗しました。手動で入力してください', variant: 'destructive' })
      setResult({
        name: '', name_kana: '', company_name: '', department: '',
        position: '', email: '', phone: '', mobile: '',
        postal_code: '', address: '', website: '',
      })
    } finally {
      setScanning(false)
    }
  }

  function extractCardInfo(text: string): OCRResult {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    const result: OCRResult = {
      name: '', name_kana: '', company_name: '', department: '',
      position: '', email: '', phone: '', mobile: '',
      postal_code: '', address: '', website: '',
    }

    for (const line of lines) {
      // メールアドレス
      const emailMatch = line.match(/[\w.+-]+@[\w-]+\.[\w.]+/)
      if (emailMatch && !result.email) result.email = emailMatch[0]

      // 電話番号（固定）
      const phoneMatch = line.match(/\d{2,4}[-–]\d{2,4}[-–]\d{4}/)
      if (phoneMatch) {
        const num = phoneMatch[0]
        if ((num.startsWith('090') || num.startsWith('080') || num.startsWith('070')) && !result.mobile) {
          result.mobile = num
        } else if (!result.phone) {
          result.phone = num
        }
      }

      // 郵便番号
      const postalMatch = line.match(/〒?(\d{3}-?\d{4})/)
      if (postalMatch && !result.postal_code) result.postal_code = postalMatch[1]

      // URL
      const urlMatch = line.match(/https?:\/\/[\w./%-]+/)
      if (urlMatch && !result.website) result.website = urlMatch[0]

      // 役職キーワード
      if (/代表|社長|部長|課長|係長|取締役|専務|常務|主任|担当|マネージャー|ディレクター/.test(line) && !result.position) {
        result.position = line
      }

      // 住所
      if (/[都道府県市区町村]/.test(line) && !result.address) {
        result.address = line.replace(/〒\d{3}-?\d{4}\s*/, '')
      }

      // Web
      if (line.startsWith('www.') && !result.website) {
        result.website = `https://${line}`
      }
    }

    // 名前は最初の短い行を候補とする
    const nameCandidates = lines.filter((l) =>
      l.length >= 2 && l.length <= 15 &&
      !l.includes('@') && !l.includes('http') &&
      !/\d{2,}/.test(l) &&
      !/[都道府県市区町村]/.test(l)
    )
    if (nameCandidates.length > 0) result.name = nameCandidates[0]

    // 会社名候補
    const companyCandidates = lines.filter((l) =>
      /株式会社|有限会社|合同会社|LLC|Ltd|Inc|Co\./.test(l)
    )
    if (companyCandidates.length > 0) result.company_name = companyCandidates[0]

    return result
  }

  async function handleSave() {
    if (!result || !result.name) {
      toast({ title: 'エラー', description: '氏名は必須です', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未認証')

      const cardId = crypto.randomUUID()
      let frontUrl: string | null = null

      if (image) {
        const ext = image.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${cardId}/front.${ext}`
        const { error } = await supabase.storage.from('card-images').upload(path, image)
        if (!error) {
          const { data } = supabase.storage.from('card-images').getPublicUrl(path)
          frontUrl = data.publicUrl
        }
      }

      const { error } = await supabase.from('business_cards').insert({
        id: cardId,
        user_id: user.id,
        ...result,
        front_image_url: frontUrl,
        is_favorite: false,
        exchange_date: new Date().toISOString().split('T')[0],
      })

      if (error) throw error
      toast({ title: '名刺を登録しました' })
      router.push(`/cards/${cardId}`)
    } catch (error: unknown) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '保存に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 画像選択 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">名刺を撮影・選択</h2>

        {preview ? (
          <div className="relative">
            <img src={preview} alt="名刺" className="w-full rounded-xl border border-border" />
            <button
              onClick={() => { setImage(null); setPreview(''); setResult(null) }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-8">
            <div className="flex flex-col items-center gap-4">
              <Camera className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                名刺を撮影またはアップロードしてください
              </p>
              <div className="flex gap-3">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                    撮影する
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  />
                </label>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                    <Upload className="w-4 h-4" />
                    ファイル選択
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileRef}
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OCRボタン */}
      {preview && !result && (
        <Button onClick={performOCR} disabled={scanning} className="w-full gap-2">
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              OCR認識中...（しばらくお待ちください）
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              文字認識を開始
            </>
          )}
        </Button>
      )}

      {/* 認識結果編集 */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">認識結果を確認・編集</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                { key: 'name' as const, label: '氏名 *', type: 'text', required: true },
                { key: 'name_kana' as const, label: 'ふりがな', type: 'text', required: false },
                { key: 'company_name' as const, label: '会社名', type: 'text', required: false },
                { key: 'department' as const, label: '部署', type: 'text', required: false },
                { key: 'position' as const, label: '役職', type: 'text', required: false },
                { key: 'email' as const, label: 'メール', type: 'email', required: false },
                { key: 'phone' as const, label: '電話（固定）', type: 'tel', required: false },
                { key: 'mobile' as const, label: '電話（携帯）', type: 'tel', required: false },
                { key: 'postal_code' as const, label: '郵便番号', type: 'text', required: false },
                { key: 'address' as const, label: '住所', type: 'text', required: false },
                { key: 'website' as const, label: 'Webサイト', type: 'url', required: false },
              ]
            ).map(({ key, label, type, required }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type={type}
                  required={required}
                  value={result[key] || ''}
                  onChange={(e) => setResult((prev) => prev ? { ...prev, [key]: e.target.value } : null)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/cards/new')}
            >
              手動入力に切替
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              登録する
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
