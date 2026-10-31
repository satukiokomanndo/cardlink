'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Download, QrCode, Star, Loader2, CreditCard } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { generateVCard, downloadVCard, exportCardToPDF } from '@/lib/export'
import QRCodeDisplay from './qr-code-display'

const TEMPLATES = [
  { id: 'simple-white', name: 'シンプル・ホワイト', bg: '#ffffff', text: '#111827', accent: '#3B82F6' },
  { id: 'luxury-black', name: '高級感・ブラック', bg: '#111827', text: '#f9fafb', accent: '#f59e0b' },
  { id: 'business-navy', name: 'ビジネス・ネイビー', bg: '#1e3a5f', text: '#f0f4ff', accent: '#60a5fa' },
  { id: 'modern-gray', name: 'モダン・グレー', bg: '#374151', text: '#f9fafb', accent: '#10b981' },
  { id: 'minimal-blue', name: 'ミニマル・ホワイト＆ブルー', bg: '#eff6ff', text: '#1e3a5f', accent: '#2563eb' },
]

interface MyCardData {
  id: string
  name: string
  company_name?: string | null
  department?: string | null
  position?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  postal_code?: string | null
  address?: string | null
  website?: string | null
  sns_twitter?: string | null
  sns_linkedin?: string | null
  sns_facebook?: string | null
  template_id: string
  design_config: Record<string, unknown>
  is_default: boolean
}

interface Props {
  initialCards: MyCardData[]
  userId: string
}

const emptyForm = {
  name: '', company_name: '', department: '', position: '',
  email: '', phone: '', mobile: '', postal_code: '',
  address: '', website: '', sns_twitter: '', sns_linkedin: '',
  sns_facebook: '', template_id: 'simple-white',
}

export function MyCardClient({ initialCards, userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [cards, setCards] = useState(initialCards)
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<MyCardData | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [showQR, setShowQR] = useState<MyCardData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MyCardData | null>(null)

  function openCreate() {
    setEditingCard(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  function openEdit(card: MyCardData) {
    setEditingCard(card)
    setFormData({
      name: card.name, company_name: card.company_name || '',
      department: card.department || '', position: card.position || '',
      email: card.email || '', phone: card.phone || '',
      mobile: card.mobile || '', postal_code: card.postal_code || '',
      address: card.address || '', website: card.website || '',
      sns_twitter: card.sns_twitter || '', sns_linkedin: card.sns_linkedin || '',
      sns_facebook: card.sns_facebook || '', template_id: card.template_id,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast({ title: 'エラー', description: '氏名は必須です', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const payload = {
        user_id: userId,
        name: formData.name.trim(),
        company_name: formData.company_name || null,
        department: formData.department || null,
        position: formData.position || null,
        email: formData.email || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        postal_code: formData.postal_code || null,
        address: formData.address || null,
        website: formData.website || null,
        sns_twitter: formData.sns_twitter || null,
        sns_linkedin: formData.sns_linkedin || null,
        sns_facebook: formData.sns_facebook || null,
        template_id: formData.template_id,
        design_config: {},
        is_default: cards.length === 0,
      }

      if (editingCard) {
        const { data, error } = await supabase.from('my_cards').update(payload).eq('id', editingCard.id).select().single()
        if (error) throw error
        setCards((prev) => prev.map((c) => c.id === editingCard.id ? data : c))
      } else {
        const { data, error } = await supabase.from('my_cards').insert(payload).select().single()
        if (error) throw error
        setCards((prev) => [data, ...prev])
      }

      toast({ title: editingCard ? 'マイ名刺を更新しました' : 'マイ名刺を作成しました' })
      setShowForm(false)
      router.refresh()
    } catch (error: unknown) {
      toast({ title: 'エラー', description: error instanceof Error ? error.message : '保存に失敗しました', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(card: MyCardData) {
    const supabase = createClient()
    const { error } = await supabase.from('my_cards').delete().eq('id', card.id)
    if (error) {
      toast({ title: 'エラー', description: '削除に失敗しました', variant: 'destructive' })
      return
    }
    setCards((prev) => prev.filter((c) => c.id !== card.id))
    toast({ title: 'マイ名刺を削除しました' })
    setDeleteTarget(null)
  }

  async function handleSetDefault(cardId: string) {
    const supabase = createClient()
    await supabase.from('my_cards').update({ is_default: false }).eq('user_id', userId)
    await supabase.from('my_cards').update({ is_default: true }).eq('id', cardId)
    setCards((prev) => prev.map((c) => ({ ...c, is_default: c.id === cardId })))
    toast({ title: 'デフォルト名刺を設定しました' })
  }

  const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]

  const f = (key: keyof typeof formData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((prev) => ({ ...prev, [key]: e.target.value })),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{cards.length}枚のマイ名刺</p>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="w-4 h-4" />
          新規作成
        </Button>
      </div>

      {cards.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">マイ名刺がありません</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            マイ名刺を作成
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => {
            const tmpl = getTemplate(card.template_id)
            return (
              <div key={card.id} className="border border-border rounded-xl overflow-hidden">
                {/* 名刺プレビュー */}
                <div
                  className="p-5 relative"
                  style={{ backgroundColor: tmpl.bg, color: tmpl.text, minHeight: '120px' }}
                >
                  {card.is_default && (
                    <span className="absolute top-2 right-2 text-xs bg-black/20 text-white px-2 py-0.5 rounded-full">
                      デフォルト
                    </span>
                  )}
                  <p className="text-lg font-bold">{card.name}</p>
                  {card.company_name && <p className="text-sm opacity-80 mt-0.5">{card.company_name}</p>}
                  {(card.department || card.position) && (
                    <p className="text-xs opacity-60 mt-0.5">
                      {[card.department, card.position].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <div className="mt-3 space-y-0.5" style={{ color: tmpl.accent }}>
                    {card.email && <p className="text-xs">{card.email}</p>}
                    {card.phone && <p className="text-xs">{card.phone}</p>}
                    {card.website && <p className="text-xs">{card.website}</p>}
                  </div>
                  <p className="text-xs opacity-40 mt-2">{tmpl.name}</p>
                </div>

                {/* アクション */}
                <div className="flex gap-1 p-2 bg-card border-t border-border">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(card)} className="gap-1 flex-1">
                    <Edit className="w-3.5 h-3.5" />
                    編集
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowQR(card)} className="gap-1 flex-1">
                    <QrCode className="w-3.5 h-3.5" />
                    QR
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => downloadVCard(card as Parameters<typeof downloadVCard>[0])}
                    className="gap-1 flex-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    vCard
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => exportCardToPDF(card as Parameters<typeof exportCardToPDF>[0])}
                    className="gap-1 flex-1"
                  >
                    PDF
                  </Button>
                  {!card.is_default && (
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => handleSetDefault(card.id)}
                      className="gap-1"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm" variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(card)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 作成・編集フォーム */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCard ? 'マイ名刺を編集' : 'マイ名刺を作成'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* テンプレート選択 */}
            <div className="space-y-2">
              <Label>テンプレート</Label>
              <div className="grid grid-cols-1 gap-2">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, template_id: tmpl.id }))}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      formData.template_id === tmpl.id ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <div className="w-8 h-5 rounded flex-shrink-0" style={{ backgroundColor: tmpl.bg, border: '1px solid #e5e7eb' }} />
                    <span className="text-sm">{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>氏名 *</Label>
                <Input placeholder="山田 太郎" {...f('name')} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>会社名</Label>
                <Input placeholder="株式会社サンプル" {...f('company_name')} />
              </div>
              <div className="space-y-1">
                <Label>部署</Label>
                <Input placeholder="営業部" {...f('department')} />
              </div>
              <div className="space-y-1">
                <Label>役職</Label>
                <Input placeholder="部長" {...f('position')} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>メール</Label>
                <Input type="email" placeholder="taro@example.com" {...f('email')} />
              </div>
              <div className="space-y-1">
                <Label>電話（固定）</Label>
                <Input type="tel" placeholder="03-1234-5678" {...f('phone')} />
              </div>
              <div className="space-y-1">
                <Label>電話（携帯）</Label>
                <Input type="tel" placeholder="090-1234-5678" {...f('mobile')} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>住所</Label>
                <Input placeholder="東京都渋谷区..." {...f('address')} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Webサイト</Label>
                <Input type="url" placeholder="https://example.com" {...f('website')} />
              </div>
              <div className="space-y-1">
                <Label>Twitter/X</Label>
                <Input placeholder="@username" {...f('sns_twitter')} />
              </div>
              <div className="space-y-1">
                <Label>LinkedIn</Label>
                <Input placeholder="プロフィールURL" {...f('sns_linkedin')} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCard ? '更新する' : '作成する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QRコード */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>QRコード</DialogTitle>
          </DialogHeader>
          {showQR && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{showQR.name}の連絡先QRコード</p>
              <div className="flex justify-center">
                <QRCodeDisplay value={generateVCard(showQR as Parameters<typeof generateVCard>[0])} size={200} />
              </div>
              <p className="text-xs text-muted-foreground">スキャンすると連絡先に追加できます</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>マイ名刺を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">「{deleteTarget?.name}」のマイ名刺を削除します。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
