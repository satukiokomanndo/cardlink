'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Camera, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusinessCard } from '@/types'

interface Tag { id: string; name: string; color?: string | null }
interface Company { id: string; name: string }

interface Props {
  card?: BusinessCard
  tags: Tag[]
  companies: Company[]
}

export function CardForm({ card, tags, companies }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(card?.tags ?? [])
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
  const [backImageFile, setBackImageFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string>(card?.front_image_url ?? '')
  const [backPreview, setBackPreview] = useState<string>(card?.back_image_url ?? '')

  const [formData, setFormData] = useState({
    name: card?.name ?? '',
    name_kana: card?.name_kana ?? '',
    company_name: card?.company_name ?? '',
    company_name_kana: card?.company_name_kana ?? '',
    department: card?.department ?? '',
    position: card?.position ?? '',
    email: card?.email ?? '',
    phone: card?.phone ?? '',
    mobile: card?.mobile ?? '',
    fax: card?.fax ?? '',
    postal_code: card?.postal_code ?? '',
    address: card?.address ?? '',
    website: card?.website ?? '',
    exchange_date: card?.exchange_date ?? new Date().toISOString().split('T')[0],
    memo: card?.memo ?? '',
    company_id: card?.company_id ?? '',
  })

  const handleImageChange = (file: File, side: 'front' | 'back') => {
    const url = URL.createObjectURL(file)
    if (side === 'front') {
      setFrontImageFile(file)
      setFrontPreview(url)
    } else {
      setBackImageFile(file)
      setBackPreview(url)
    }
  }

  async function uploadImage(file: File, userId: string, cardId: string, side: string): Promise<string | null> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${cardId}/${side}.${ext}`
    const { error } = await supabase.storage.from('card-images').upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('card-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({ title: 'エラー', description: '氏名は必須です', variant: 'destructive' })
      return
    }
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未認証')

      let frontUrl = card?.front_image_url ?? null
      let backUrl = card?.back_image_url ?? null

      const cardId = card?.id ?? crypto.randomUUID()

      if (frontImageFile) frontUrl = await uploadImage(frontImageFile, user.id, cardId, 'front')
      if (backImageFile) backUrl = await uploadImage(backImageFile, user.id, cardId, 'back')

      const payload = {
        ...formData,
        id: cardId,
        user_id: user.id,
        front_image_url: frontUrl,
        back_image_url: backUrl,
        company_id: formData.company_id || null,
        is_favorite: card?.is_favorite ?? false,
      }

      const { error: cardError } = card
        ? await supabase.from('business_cards').update(payload).eq('id', card.id)
        : await supabase.from('business_cards').insert(payload)

      if (cardError) throw cardError

      // タグを更新
      await supabase.from('card_tags').delete().eq('card_id', cardId)
      if (selectedTags.length > 0) {
        await supabase.from('card_tags').insert(
          selectedTags.map((tagId) => ({ card_id: cardId, tag_id: tagId }))
        )
      }

      // 変更履歴を記録（編集の場合）
      if (card) {
        const changes: Array<{ card_id: string; user_id: string; field_name: string; old_value: string | null; new_value: string | null }> = []
        const fields = Object.keys(formData) as (keyof typeof formData)[]
        for (const field of fields) {
          const oldVal = String(card[field as keyof BusinessCard] ?? '')
          const newVal = String(formData[field] ?? '')
          if (oldVal !== newVal) {
            changes.push({ card_id: card.id, user_id: user.id, field_name: field, old_value: oldVal || null, new_value: newVal || null })
          }
        }
        if (changes.length > 0) {
          await supabase.from('card_change_histories').insert(changes)
        }
      }

      toast({ title: card ? '名刺を更新しました' : '名刺を登録しました' })
      router.push(`/cards/${cardId}`)
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '保存に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof formData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((prev) => ({ ...prev, [key]: e.target.value })),
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      {/* 名刺画像 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">名刺画像</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['front', 'back'] as const).map((side) => {
            const preview = side === 'front' ? frontPreview : backPreview
            return (
              <div key={side} className="space-y-1">
                <p className="text-xs text-muted-foreground">{side === 'front' ? '表面' : '裏面'}</p>
                <div className={cn(
                  'relative border-2 border-dashed border-border rounded-xl overflow-hidden',
                  'aspect-[1.75/1] flex items-center justify-center bg-muted/20 cursor-pointer hover:border-primary/50 transition-colors'
                )}>
                  {preview ? (
                    <>
                      <img src={preview} alt={side} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          if (side === 'front') { setFrontPreview(''); setFrontImageFile(null) }
                          else { setBackPreview(''); setBackImageFile(null) }
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center gap-1 cursor-pointer p-4 w-full h-full justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">タップして撮影/選択</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0], side)}
                      />
                    </label>
                  )}
                </div>
                {!preview && (
                  <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer hover:underline">
                    <Upload className="w-3 h-3" />
                    ファイルから選択
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0], side)}
                    />
                  </label>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 基本情報 */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">基本情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">氏名 <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="山田 太郎" required {...field('name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name_kana">ふりがな</Label>
            <Input id="name_kana" placeholder="やまだ たろう" {...field('name_kana')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">会社名</Label>
            <Input id="company_name" placeholder="株式会社サンプル" {...field('company_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name_kana">会社名（ふりがな）</Label>
            <Input id="company_name_kana" placeholder="かぶしきがいしゃさんぷる" {...field('company_name_kana')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">部署</Label>
            <Input id="department" placeholder="営業部" {...field('department')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">役職</Label>
            <Input id="position" placeholder="部長" {...field('position')} />
          </div>
        </div>
      </div>

      {/* 連絡先 */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">連絡先</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" placeholder="taro@example.com" {...field('email')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号（固定）</Label>
            <Input id="phone" type="tel" placeholder="03-1234-5678" {...field('phone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">電話番号（携帯）</Label>
            <Input id="mobile" type="tel" placeholder="090-1234-5678" {...field('mobile')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fax">FAX</Label>
            <Input id="fax" type="tel" placeholder="03-1234-5679" {...field('fax')} />
          </div>
        </div>
      </div>

      {/* 住所・Web */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">住所・Web</h2>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="postal_code">郵便番号</Label>
            <Input id="postal_code" placeholder="123-4567" {...field('postal_code')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input id="address" placeholder="東京都渋谷区..." {...field('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Webサイト</Label>
            <Input id="website" type="url" placeholder="https://example.com" {...field('website')} />
          </div>
        </div>
      </div>

      {/* 交換日・メモ */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">記録</h2>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="exchange_date">交換日</Label>
            <Input id="exchange_date" type="date" {...field('exchange_date')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              placeholder="メモを入力..."
              rows={3}
              value={formData.memo}
              onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* タグ */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">タグ</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTags((prev) =>
                  prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                )}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
                  selectedTags.includes(tag.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/50'
                )}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#3B82F6' }} />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 会社紐付け */}
      {companies.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="company_id">会社に紐付け</Label>
          <select
            id="company_id"
            value={formData.company_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, company_id: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">紐付けなし</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 送信ボタン */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {card ? '更新する' : '登録する'}
        </Button>
      </div>
    </form>
  )
}
