'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Star, Filter, SortAsc } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, normalizeKana, getKanaRow, KANA_ROWS } from '@/lib/utils'

interface Tag {
  id: string
  name: string
  color?: string | null
}

interface CardWithTags {
  id: string
  name: string
  name_kana?: string | null
  company_name?: string | null
  company_name_kana?: string | null
  position?: string | null
  department?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  exchange_date?: string | null
  is_favorite: boolean
  front_image_url?: string | null
  created_at: string
  updated_at: string
  card_tags?: Array<{ tag_id: string; tags: Tag | null }>
}

interface Props {
  initialCards: CardWithTags[]
  tags: Tag[]
}

type SortMode = 'kana' | 'company' | 'recent' | 'exchange'
type ViewMode = 'list' | 'grid'

export function CardListClient({ initialCards, tags }: Props) {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('kana')
  const [viewMode] = useState<ViewMode>('list')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let cards = [...initialCards]

    if (query) {
      const q = query.toLowerCase()
      const qKana = normalizeKana(query)
      cards = cards.filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          (c.name_kana && normalizeKana(c.name_kana).includes(qKana)) ||
          (c.company_name && c.company_name.toLowerCase().includes(q)) ||
          (c.company_name_kana && normalizeKana(c.company_name_kana).includes(qKana)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(query)) ||
          (c.mobile && c.mobile.includes(query))
        )
      })
    }

    if (favoriteOnly) {
      cards = cards.filter((c) => c.is_favorite)
    }

    if (selectedTags.length > 0) {
      cards = cards.filter((c) =>
        selectedTags.every((tid) =>
          c.card_tags?.some((ct) => ct.tag_id === tid)
        )
      )
    }

    if (selectedRow) {
      if (selectedRow === 'A-Z') {
        cards = cards.filter((c) => /^[A-Za-z]/.test(c.name_kana || c.name))
      } else if (selectedRow === 'その他') {
        cards = cards.filter((c) => {
          const row = getKanaRow(c.name_kana || c.name)
          return row === 'その他'
        })
      } else {
        cards = cards.filter((c) => getKanaRow(c.name_kana || c.name) === selectedRow)
      }
    }

    cards.sort((a, b) => {
      if (sortMode === 'kana') {
        return normalizeKana(a.name_kana || a.name).localeCompare(normalizeKana(b.name_kana || b.name), 'ja')
      }
      if (sortMode === 'company') {
        return normalizeKana(a.company_name_kana || a.company_name || '').localeCompare(
          normalizeKana(b.company_name_kana || b.company_name || ''), 'ja'
        )
      }
      if (sortMode === 'exchange') {
        return (b.exchange_date || '').localeCompare(a.exchange_date || '')
      }
      return b.updated_at.localeCompare(a.updated_at)
    })

    return cards
  }, [initialCards, query, favoriteOnly, selectedTags, sortMode, selectedRow])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">名刺一覧</h1>
        <Link href="/cards/new">
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            追加
          </Button>
        </Link>
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="氏名・会社名・電話番号・メールで検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* フィルター */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={favoriteOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFavoriteOnly(!favoriteOnly)}
          className="gap-1.5"
        >
          <Star className="w-3.5 h-3.5" />
          お気に入り
        </Button>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        {(['kana', 'company', 'recent', 'exchange'] as SortMode[]).map((mode) => (
          <Button
            key={mode}
            variant={sortMode === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortMode(mode)}
          >
            {mode === 'kana' && '五十音'}
            {mode === 'company' && '会社名'}
            {mode === 'recent' && '最近更新'}
            {mode === 'exchange' && '交換日'}
          </Button>
        ))}
      </div>

      {/* タグフィルター */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                selectedTags.includes(tag.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color || '#3B82F6' }}
              />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* 五十音インデックス */}
      <div className="flex gap-1 flex-wrap">
        {[...KANA_ROWS, { label: 'その他', chars: [] }].map((row) => (
          <button
            key={row.label}
            onClick={() => setSelectedRow(selectedRow === row.label ? null : row.label)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              selectedRow === row.label
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {row.label}
          </button>
        ))}
      </div>

      {/* 件数表示 */}
      <p className="text-sm text-muted-foreground">{filtered.length}件</p>

      {/* 名刺リスト */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">名刺が見つかりません</p>
          <Link href="/cards/new" className="text-primary text-sm hover:underline mt-2 inline-block">
            名刺を追加する
          </Link>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'
        )}>
          {filtered.map((card) => (
            <Link
              key={card.id}
              href={`/cards/${card.id}`}
              className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              {card.front_image_url ? (
                <img
                  src={card.front_image_url}
                  alt={card.name}
                  className="w-12 h-8 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {card.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{card.name}</p>
                  {card.is_favorite && <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 fill-current" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {[card.company_name, card.position].filter(Boolean).join(' · ')}
                </p>
                {card.card_tags && card.card_tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {card.card_tags.slice(0, 3).map((ct) => ct.tags && (
                      <Badge key={ct.tag_id} variant="secondary" className="text-xs px-1.5 py-0">
                        {ct.tags.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {card.name_kana?.charAt(0) || card.name.charAt(0)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
