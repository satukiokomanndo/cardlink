'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Star, Edit, Trash2, Share2, FileText, Phone, Mail, Globe,
  MapPin, Building2, Calendar, MessageSquare, Clock, ChevronLeft,
  Download, Plus, Image
} from 'lucide-react'
import { formatDate, formatDateShort } from '@/lib/utils'
import { exportCardToPDF, exportCardToImage } from '@/lib/export'

interface Tag { id: string; name: string; color?: string | null }
interface ContactHistory {
  id: string
  contact_date: string
  location?: string | null
  content?: string | null
  next_contact_date?: string | null
  next_contact_memo?: string | null
}

interface CardData {
  id: string
  name: string
  name_kana?: string | null
  company_name?: string | null
  department?: string | null
  position?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  fax?: string | null
  postal_code?: string | null
  address?: string | null
  website?: string | null
  front_image_url?: string | null
  back_image_url?: string | null
  exchange_date?: string | null
  memo?: string | null
  is_favorite: boolean
  card_tags?: Array<{ tag_id: string; tags: Tag | null }>
  companies?: { id: string; name: string } | null
}

interface Props {
  card: CardData
  histories: ContactHistory[]
  userId: string
}

export function CardDetail({ card, histories, userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isFavorite, setIsFavorite] = useState(card.is_favorite)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [imageTab, setImageTab] = useState<'front' | 'back'>('front')
  const [historyForm, setHistoryForm] = useState({
    contact_date: new Date().toISOString().slice(0, 16),
    location: '',
    content: '',
    next_contact_date: '',
    next_contact_memo: '',
  })

  async function toggleFavorite() {
    const supabase = createClient()
    const newVal = !isFavorite
    const { error } = await supabase
      .from('business_cards')
      .update({ is_favorite: newVal })
      .eq('id', card.id)
      .eq('user_id', userId)
    if (!error) setIsFavorite(newVal)
  }

  async function handleDelete() {
    const supabase = createClient()
    const { error } = await supabase
      .from('business_cards')
      .delete()
      .eq('id', card.id)
      .eq('user_id', userId)
    if (error) {
      toast({ title: 'エラー', description: '削除に失敗しました', variant: 'destructive' })
      return
    }
    toast({ title: '名刺を削除しました' })
    router.push('/cards')
    router.refresh()
  }

  async function handleAddHistory() {
    const supabase = createClient()
    const { error } = await supabase.from('contact_histories').insert({
      user_id: userId,
      card_id: card.id,
      contact_date: historyForm.contact_date,
      location: historyForm.location || null,
      content: historyForm.content || null,
      next_contact_date: historyForm.next_contact_date || null,
      next_contact_memo: historyForm.next_contact_memo || null,
    })
    if (error) {
      toast({ title: 'エラー', description: '保存に失敗しました', variant: 'destructive' })
      return
    }
    toast({ title: '交流履歴を追加しました' })
    setShowHistoryDialog(false)
    router.refresh()
  }

  async function handleExportPDF() {
    try {
      await exportCardToPDF(card)
      toast({ title: 'PDFを出力しました' })
    } catch {
      toast({ title: 'エラー', description: 'PDF出力に失敗しました', variant: 'destructive' })
    }
  }

  async function handleExportImage(format: 'jpg' | 'png') {
    try {
      await exportCardToImage(card, format)
      toast({ title: `${format.toUpperCase()}を出力しました` })
    } catch {
      toast({ title: 'エラー', description: '画像出力に失敗しました', variant: 'destructive' })
    }
  }

  async function handleShare() {
    const text = [
      card.name,
      card.company_name,
      card.position,
      card.department,
      card.email && `Email: ${card.email}`,
      card.phone && `TEL: ${card.phone}`,
      card.mobile && `Mobile: ${card.mobile}`,
      card.website,
      card.address,
    ].filter(Boolean).join('\n')

    if (navigator.share) {
      await navigator.share({ title: card.name, text })
    } else {
      await navigator.clipboard.writeText(text)
      toast({ title: 'クリップボードにコピーしました' })
    }
    setShowShareDialog(false)
  }

  const currentImage = imageTab === 'front' ? card.front_image_url : card.back_image_url

  return (
    <div className="space-y-4 pb-8">
      {/* ナビゲーション */}
      <div className="flex items-center gap-2 -mx-1">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors p-1">
          <ChevronLeft className="w-4 h-4" />
          戻る
        </button>
      </div>

      {/* 名刺画像 */}
      {(card.front_image_url || card.back_image_url) && (
        <div className="space-y-2">
          {(card.front_image_url && card.back_image_url) && (
            <div className="flex gap-2">
              {(['front', 'back'] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setImageTab(side)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    imageTab === side ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {side === 'front' ? '表面' : '裏面'}
                </button>
              ))}
            </div>
          )}
          {currentImage && (
            <img
              src={currentImage}
              alt={`${card.name}の名刺${imageTab === 'front' ? '表' : '裏'}面`}
              className="w-full rounded-xl border border-border shadow-sm"
            />
          )}
        </div>
      )}

      {/* プロフィール */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {card.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{card.name}</h1>
              <button onClick={toggleFavorite} className="text-yellow-500">
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
            {card.name_kana && <p className="text-sm text-muted-foreground">{card.name_kana}</p>}
            {card.company_name && (
              <p className="text-sm font-medium mt-1">{card.company_name}</p>
            )}
            {(card.department || card.position) && (
              <p className="text-sm text-muted-foreground">
                {[card.department, card.position].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* タグ */}
        {card.card_tags && card.card_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {card.card_tags.map((ct) => ct.tags && (
              <Badge key={ct.tag_id} variant="secondary" className="gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ct.tags.color || '#3B82F6' }} />
                {ct.tags.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Edit, label: '編集', action: () => router.push(`/cards/${card.id}/edit`) },
          { icon: FileText, label: 'PDF', action: handleExportPDF },
          { icon: Image, label: '画像', action: () => handleExportImage('jpg') },
          { icon: Share2, label: '共有', action: () => setShowShareDialog(true) },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors"
          >
            <btn.icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* 連絡先情報 */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {card.email && (
          <a href={`mailto:${card.email}`} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">メール</p>
              <p className="text-sm font-medium text-primary">{card.email}</p>
            </div>
          </a>
        )}
        {card.phone && (
          <a href={`tel:${card.phone}`} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">電話（固定）</p>
              <p className="text-sm font-medium text-primary">{card.phone}</p>
            </div>
          </a>
        )}
        {card.mobile && (
          <a href={`tel:${card.mobile}`} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">電話（携帯）</p>
              <p className="text-sm font-medium text-primary">{card.mobile}</p>
            </div>
          </a>
        )}
        {card.website && (
          <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Webサイト</p>
              <p className="text-sm font-medium text-primary truncate">{card.website}</p>
            </div>
          </a>
        )}
        {card.address && (
          <div className="flex items-start gap-3 p-4">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">住所</p>
              <p className="text-sm">{card.postal_code && `〒${card.postal_code} `}{card.address}</p>
            </div>
          </div>
        )}
        {card.companies && (
          <Link href={`/companies/${card.companies.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">会社</p>
              <p className="text-sm font-medium text-primary">{card.companies.name}</p>
            </div>
          </Link>
        )}
        {card.exchange_date && (
          <div className="flex items-center gap-3 p-4">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">交換日</p>
              <p className="text-sm">{formatDate(card.exchange_date)}</p>
            </div>
          </div>
        )}
      </div>

      {/* メモ */}
      {card.memo && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium">メモ</p>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{card.memo}</p>
        </div>
      )}

      {/* 交流履歴 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            交流履歴
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowHistoryDialog(true)} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            追加
          </Button>
        </div>

        {histories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">交流履歴がありません</p>
        ) : (
          <div className="space-y-2">
            {histories.map((h) => (
              <div key={h.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{formatDateShort(h.contact_date)}</p>
                  {h.location && <p className="text-xs text-muted-foreground">{h.location}</p>}
                </div>
                {h.content && <p className="text-sm text-muted-foreground">{h.content}</p>}
                {h.next_contact_date && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-primary">
                      次回: {formatDateShort(h.next_contact_date)}
                      {h.next_contact_memo && ` - ${h.next_contact_memo}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 削除ボタン */}
      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4" />
          この名刺を削除
        </Button>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>名刺を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            「{card.name}」の名刺を削除します。この操作は取り消せません。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 交流履歴追加ダイアログ */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>交流履歴を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>日時</Label>
              <Input type="datetime-local" value={historyForm.contact_date}
                onChange={(e) => setHistoryForm((p) => ({ ...p, contact_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>場所</Label>
              <Input placeholder="渋谷オフィス" value={historyForm.location}
                onChange={(e) => setHistoryForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>内容</Label>
              <Textarea placeholder="商談内容、会話メモなど..." rows={3} value={historyForm.content}
                onChange={(e) => setHistoryForm((p) => ({ ...p, content: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>次回連絡予定</Label>
              <Input type="datetime-local" value={historyForm.next_contact_date}
                onChange={(e) => setHistoryForm((p) => ({ ...p, next_contact_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>次回メモ</Label>
              <Input placeholder="フォローアップ内容など" value={historyForm.next_contact_memo}
                onChange={(e) => setHistoryForm((p) => ({ ...p, next_contact_memo: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>キャンセル</Button>
            <Button onClick={handleAddHistory}>追加する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 共有ダイアログ */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>名刺情報を共有</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">共有する形式を選んでください</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                テキスト共有
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                <FileText className="w-4 h-4" />
                PDF共有
              </Button>
              <Button variant="outline" onClick={() => handleExportImage('jpg')} className="gap-2">
                <Download className="w-4 h-4" />
                JPG保存
              </Button>
              <Button variant="outline" onClick={() => handleExportImage('png')} className="gap-2">
                <Download className="w-4 h-4" />
                PNG保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
