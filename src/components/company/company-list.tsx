'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Search, Building2, Loader2, Phone, Globe, MapPin } from 'lucide-react'

interface Company {
  id: string
  name: string
  name_kana?: string | null
  industry?: string | null
  phone?: string | null
  email?: string | null
  postal_code?: string | null
  address?: string | null
  website?: string | null
  memo?: string | null
}

interface Props {
  initialCompanies: Company[]
  userId: string
}

const emptyForm = {
  name: '', name_kana: '', industry: '', phone: '', email: '',
  postal_code: '', address: '', website: '', memo: '',
}

export function CompanyList({ initialCompanies, userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [companies, setCompanies] = useState(initialCompanies)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.name_kana && c.name_kana.toLowerCase().includes(query.toLowerCase()))
  )

  function openCreate() {
    setEditingCompany(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  function openEdit(company: Company) {
    setEditingCompany(company)
    setFormData({
      name: company.name, name_kana: company.name_kana || '',
      industry: company.industry || '', phone: company.phone || '',
      email: company.email || '', postal_code: company.postal_code || '',
      address: company.address || '', website: company.website || '',
      memo: company.memo || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast({ title: 'エラー', description: '会社名は必須です', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const payload = {
        user_id: userId,
        name: formData.name.trim(),
        name_kana: formData.name_kana || null,
        industry: formData.industry || null,
        phone: formData.phone || null,
        email: formData.email || null,
        postal_code: formData.postal_code || null,
        address: formData.address || null,
        website: formData.website || null,
        memo: formData.memo || null,
      }

      if (editingCompany) {
        const { data, error } = await supabase.from('companies').update(payload).eq('id', editingCompany.id).select().single()
        if (error) throw error
        setCompanies((prev) => prev.map((c) => c.id === editingCompany.id ? data : c))
        toast({ title: '会社情報を更新しました' })
      } else {
        const { data, error } = await supabase.from('companies').insert(payload).select().single()
        if (error) throw error
        setCompanies((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'ja')))
        toast({ title: '会社を登録しました' })
      }
      setShowForm(false)
      router.refresh()
    } catch (error: unknown) {
      toast({ title: 'エラー', description: error instanceof Error ? error.message : '保存に失敗しました', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(company: Company) {
    const supabase = createClient()
    const { error } = await supabase.from('companies').delete().eq('id', company.id)
    if (error) {
      toast({ title: 'エラー', description: '削除に失敗しました', variant: 'destructive' })
      return
    }
    setCompanies((prev) => prev.filter((c) => c.id !== company.id))
    toast({ title: '会社を削除しました' })
    setDeleteTarget(null)
    router.refresh()
  }

  const f = (key: keyof typeof formData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((prev) => ({ ...prev, [key]: e.target.value })),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{companies.length}社</p>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="w-4 h-4" />
          会社を登録
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="会社名で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {query ? '会社が見つかりません' : '会社が登録されていません'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((company) => (
            <div key={company.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/companies/${company.id}`} className="font-medium hover:text-primary transition-colors">
                      {company.name}
                    </Link>
                    {company.name_kana && <p className="text-xs text-muted-foreground">{company.name_kana}</p>}
                    {company.industry && <p className="text-xs text-muted-foreground mt-0.5">{company.industry}</p>}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {company.phone && (
                        <a href={`tel:${company.phone}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Phone className="w-3 h-3" />
                          {company.phone}
                        </a>
                      )}
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Globe className="w-3 h-3" />
                          Web
                        </a>
                      )}
                      {company.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {company.address.slice(0, 15)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => openEdit(company)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="w-8 h-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(company)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* フォームダイアログ */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? '会社情報を編集' : '会社を登録'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>会社名 *</Label>
              <Input placeholder="株式会社サンプル" {...f('name')} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>会社名（ふりがな）</Label>
              <Input placeholder="かぶしきがいしゃさんぷる" {...f('name_kana')} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>業種</Label>
              <Input placeholder="IT・ソフトウェア" {...f('industry')} />
            </div>
            <div className="space-y-1">
              <Label>電話番号</Label>
              <Input type="tel" placeholder="03-1234-5678" {...f('phone')} />
            </div>
            <div className="space-y-1">
              <Label>メール</Label>
              <Input type="email" placeholder="info@example.com" {...f('email')} />
            </div>
            <div className="space-y-1">
              <Label>郵便番号</Label>
              <Input placeholder="123-4567" {...f('postal_code')} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>住所</Label>
              <Input placeholder="東京都渋谷区..." {...f('address')} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Webサイト</Label>
              <Input type="url" placeholder="https://example.com" {...f('website')} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>メモ</Label>
              <Textarea rows={2} placeholder="メモを入力..." value={formData.memo} onChange={f('memo').onChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCompany ? '更新する' : '登録する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>会社を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">「{deleteTarget?.name}」を削除します。紐付いた名刺の会社情報も解除されます。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
