'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'

const TAG_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
]

interface TagData {
  id: string
  name: string
  color?: string | null
  created_at: string
}

interface Props {
  tags: TagData[]
  tagCounts: Record<string, number>
}

export function TagManager({ tags: initialTags, tagCounts }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [tags, setTags] = useState(initialTags)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<TagData | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState(TAG_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TagData | null>(null)

  function openCreate() {
    setEditingTag(null)
    setTagName('')
    setTagColor(TAG_COLORS[0])
    setShowDialog(true)
  }

  function openEdit(tag: TagData) {
    setEditingTag(tag)
    setTagName(tag.name)
    setTagColor(tag.color || TAG_COLORS[0])
    setShowDialog(true)
  }

  async function handleSave() {
    if (!tagName.trim()) {
      toast({ title: 'エラー', description: 'タグ名を入力してください', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未認証')

      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update({ name: tagName.trim(), color: tagColor })
          .eq('id', editingTag.id)
        if (error) throw error
        setTags((prev) => prev.map((t) => t.id === editingTag.id ? { ...t, name: tagName.trim(), color: tagColor } : t))
        toast({ title: 'タグを更新しました' })
      } else {
        const { data, error } = await supabase
          .from('tags')
          .insert({ user_id: user.id, name: tagName.trim(), color: tagColor })
          .select()
          .single()
        if (error) throw error
        setTags((prev) => [...prev, data])
        toast({ title: 'タグを作成しました' })
      }
      setShowDialog(false)
    } catch (error: unknown) {
      toast({ title: 'エラー', description: error instanceof Error ? error.message : '保存に失敗しました', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(tag: TagData) {
    const supabase = createClient()
    const { error } = await supabase.from('tags').delete().eq('id', tag.id)
    if (error) {
      toast({ title: 'エラー', description: '削除に失敗しました', variant: 'destructive' })
      return
    }
    setTags((prev) => prev.filter((t) => t.id !== tag.id))
    toast({ title: 'タグを削除しました' })
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tags.length}個のタグ</p>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="w-4 h-4" />
          タグを作成
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">タグがありません</p>
          <Button size="sm" onClick={openCreate} className="mt-3 gap-1">
            <Plus className="w-4 h-4" />
            最初のタグを作成
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color || '#3B82F6' }}
              />
              <div className="flex-1">
                <span className="font-medium">{tag.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {tagCounts[tag.id] ?? 0}枚
                </span>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => openEdit(tag)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(tag)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 作成・編集ダイアログ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'タグを編集' : 'タグを作成'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>タグ名</Label>
              <Input
                placeholder="例: 重要、取引先、フォロー中..."
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label>カラー</Label>
              <div className="flex gap-2 flex-wrap">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTagColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      tagColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tagColor }} />
              <span className="text-sm">{tagName || 'タグ名プレビュー'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={loading}>
              {editingTag ? '更新する' : '作成する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>タグを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            「{deleteTarget?.name}」を削除します。このタグが付いた名刺からも外れます。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
