export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { CardForm } from '@/components/cards/card-form'

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [cardResult, tagsResult, companiesResult] = await Promise.all([
    supabase.from('business_cards')
      .select('*, card_tags(tag_id)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase.from('tags').select('id, name, color').eq('user_id', user.id).order('name'),
    supabase.from('companies').select('id, name').eq('user_id', user.id).order('name'),
  ])

  if (!cardResult.data) notFound()

  const card = {
    ...cardResult.data,
    tags: cardResult.data.card_tags?.map((ct: { tag_id: string }) => ct.tag_id) ?? [],
  }

  return (
    <AppLayout title="名刺を編集">
      <CardForm card={card} tags={tagsResult.data ?? []} companies={companiesResult.data ?? []} />
    </AppLayout>
  )
}
