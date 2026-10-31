export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { CardForm } from '@/components/cards/card-form'

export default async function NewCardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('name')

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')

  return (
    <AppLayout title="名刺を登録">
      <CardForm tags={tags ?? []} companies={companies ?? []} />
    </AppLayout>
  )
}
