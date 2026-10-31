export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { CardDetail } from '@/components/cards/card-detail'

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: card } = await supabase
    .from('business_cards')
    .select(`
      *,
      card_tags(tag_id, tags(id, name, color)),
      companies(id, name)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!card) notFound()

  const { data: histories } = await supabase
    .from('contact_histories')
    .select('*')
    .eq('card_id', id)
    .order('contact_date', { ascending: false })
    .limit(10)

  return (
    <AppLayout>
      <CardDetail card={card} histories={histories ?? []} userId={user.id} />
    </AppLayout>
  )
}
