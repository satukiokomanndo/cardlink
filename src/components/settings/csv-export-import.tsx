'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Download, Upload, ChevronLeft, Loader2, AlertTriangle, Check } from 'lucide-react'
import Papa from 'papaparse'

interface Props {
  onBack: () => void
}

const CSV_HEADERS = [
  'name', 'name_kana', 'company_name', 'company_name_kana',
  'department', 'position', 'email', 'phone', 'mobile', 'fax',
  'postal_code', 'address', 'website', 'exchange_date', 'memo'
]

const CSV_HEADER_LABELS: Record<string, string> = {
  name: '氏名', name_kana: 'ふりがな', company_name: '会社名', company_name_kana: '会社名（ふりがな）',
  department: '部署', position: '役職', email: 'メール', phone: '電話（固定）',
  mobile: '電話（携帯）', fax: 'FAX', postal_code: '郵便番号', address: '住所',
  website: 'Webサイト', exchange_date: '交換日', memo: 'メモ'
}

interface PreviewRow {
  data: Record<string, string>
  error?: string
  isDuplicate?: boolean
}

export function CSVExportImport({ onBack }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未認証')

      const { data: cards, error } = await supabase
        .from('business_cards')
        .select(CSV_HEADERS.join(', '))
        .eq('user_id', user.id)
        .order('name_kana')

      if (error) throw error

      const csvData = [
        CSV_HEADERS.map((h) => CSV_HEADER_LABELS[h] || h),
        ...(cards || []).map((card) => CSV_HEADERS.map((h) => String(card[h as keyof typeof card] ?? '')))
      ]

      const csv = Papa.unparse(csvData, { header: false })
      const bom = '﻿' // UTF-8 BOM for Excel
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CardLink_名刺データ_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({ title: 'CSVをエクスポートしました', description: `${cards?.length ?? 0}件` })
    } catch (error: unknown) {
      toast({ title: 'エラー', description: error instanceof Error ? error.message : 'エクスポートに失敗しました', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleFileSelect(file: File) {
    const text = await file.text()
    const { data: parsed } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const found = Object.entries(CSV_HEADER_LABELS).find(([, v]) => v === header.trim())
        return found ? found[0] : header.trim()
      },
    })

    // バリデーション
    const previewRows: PreviewRow[] = parsed.map((row) => {
      const errors: string[] = []
      if (!row.name?.trim()) errors.push('氏名は必須です')
      return {
        data: row,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      }
    })

    // 重複チェック
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const names = previewRows.map((r) => r.data.name?.trim()).filter(Boolean)
      const { data: existing } = await supabase
        .from('business_cards')
        .select('name')
        .eq('user_id', user.id)
        .in('name', names)

      const existingNames = new Set((existing || []).map((e) => e.name))
      previewRows.forEach((row) => {
        if (existingNames.has(row.data.name?.trim())) {
          row.isDuplicate = true
        }
      })
    }

    setPreview(previewRows)
    setShowPreview(true)
  }

  async function handleImport() {
    const validRows = preview.filter((r) => !r.error)
    if (validRows.length === 0) {
      toast({ title: 'エラー', description: 'インポートできるデータがありません', variant: 'destructive' })
      return
    }
    setImporting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未認証')

      const records = validRows.map((row) => ({
        user_id: user.id,
        name: row.data.name.trim(),
        name_kana: row.data.name_kana?.trim() || null,
        company_name: row.data.company_name?.trim() || null,
        company_name_kana: row.data.company_name_kana?.trim() || null,
        department: row.data.department?.trim() || null,
        position: row.data.position?.trim() || null,
        email: row.data.email?.trim() || null,
        phone: row.data.phone?.trim() || null,
        mobile: row.data.mobile?.trim() || null,
        fax: row.data.fax?.trim() || null,
        postal_code: row.data.postal_code?.trim() || null,
        address: row.data.address?.trim() || null,
        website: row.data.website?.trim() || null,
        exchange_date: row.data.exchange_date?.trim() || null,
        memo: row.data.memo?.trim() || null,
        is_favorite: false,
      }))

      // バッチ挿入（100件ずつ）
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100)
        const { error } = await supabase.from('business_cards').insert(batch)
        if (error) throw error
      }

      toast({ title: 'インポート完了', description: `${records.length}件を登録しました` })
      setShowPreview(false)
      setPreview([])
      router.refresh()
    } catch (error: unknown) {
      toast({ title: 'エラー', description: error instanceof Error ? error.message : 'インポートに失敗しました', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
        設定に戻る
      </button>

      <h2 className="text-lg font-bold">CSVエクスポート・インポート</h2>

      {/* エクスポート */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" />
          エクスポート
        </h3>
        <p className="text-sm text-muted-foreground">
          登録済みの名刺データをCSVファイルとしてダウンロードします。Excelで開けるUTF-8形式で出力されます。
        </p>
        <Button onClick={handleExport} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          CSVをダウンロード
        </Button>
      </div>

      {/* インポート */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4" />
          インポート
        </h3>
        <p className="text-sm text-muted-foreground">
          CSVファイルから名刺データを一括登録します。エクスポートしたCSVと同じ形式、またはExcelで作成したCSVを使用できます。
        </p>
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            <Upload className="w-4 h-4" />
            CSVファイルを選択
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
        </label>
      </div>

      {/* プレビュー */}
      {showPreview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">インポートプレビュー</h3>
            <div className="text-sm text-muted-foreground">
              有効: {preview.filter((r) => !r.error).length}件 /
              エラー: {preview.filter((r) => r.error).length}件 /
              重複: {preview.filter((r) => r.isDuplicate).length}件
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">状態</th>
                    <th className="px-3 py-2 text-left font-medium">氏名</th>
                    <th className="px-3 py-2 text-left font-medium">会社名</th>
                    <th className="px-3 py-2 text-left font-medium">メール</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.map((row, i) => (
                    <tr key={i} className={row.error ? 'bg-red-50' : row.isDuplicate ? 'bg-yellow-50' : ''}>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        ) : row.isDuplicate ? (
                          <span className="text-yellow-600 text-xs">重複</span>
                        ) : (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </td>
                      <td className="px-3 py-2">{row.data.name}</td>
                      <td className="px-3 py-2">{row.data.company_name}</td>
                      <td className="px-3 py-2">{row.data.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {preview.filter((r) => r.error).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              エラーのある行はスキップされます。重複する名刺も登録されます。
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowPreview(false); setPreview([]) }}>
              キャンセル
            </Button>
            <Button onClick={handleImport} disabled={importing} className="flex-1 gap-2">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {preview.filter((r) => !r.error).length}件をインポート
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
