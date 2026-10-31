export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { CardListClient } from '@/components/cards/card-list-client'

export default async function CardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [cardsResult, tagsResult] = await Promise.all([
    supabase
      .from('business_cards')
      .select('id, name, name_kana, company_name, company_name_kana, position, department, email, phone, mobile, exchange_date, is_favorite, front_image_url, created_at, updated_at')
      .eq('user_id', user.id)
      .order('name_kana', { ascending: true }),
    supabase
      .from('tags')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name'),
  ])

  // タグを別途取得してカードに付与
  const cardIds = (cardsResult.data ?? []).map((c) => c.id)
  let cardTagsMap: Record<string, Array<{ tag_id: string; tags: { id: string; name: string; color: string | null } | null }>> = {}
  if (cardIds.length > 0) {
    const { data: cardTags } = await supabase
      .from('card_tags')
      .select('card_id, tag_id, tags(id, name, color)')
      .in('card_id', cardIds)
    for (const ct of (cardTags ?? [])) {
      const rec = ct as { card_id: string; tag_id: string; tags: { id: string; name: string; color: string | null } | { id: string; name: string; color: string | null }[] | null }
      const tag = Array.isArray(rec.tags) ? rec.tags[0] ?? null : rec.tags
      if (!cardTagsMap[rec.card_id]) cardTagsMap[rec.card_id] = []
      cardTagsMap[rec.card_id].push({ tag_id: rec.tag_id, tags: tag })
    }
  }

  const cards = (cardsResult.data ?? []).map((card) => ({
    ...card,
    card_tags: cardTagsMap[card.id] ?? [],
  }))

  return (
    <AppLayout>
      <CardListClient
        initialCards={cards}
        tags={tagsResult.data ?? []}
      />
    </AppLayout>
  )
}
