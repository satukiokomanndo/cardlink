export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { MyCardClient } from '@/components/mycard/my-card-client'

export default async function MyCardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: myCards } = await supabase
    .from('my_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <AppLayout title="マイ名刺">
      <MyCardClient initialCards={myCards ?? []} userId={user.id} />
    </AppLayout>
  )
}
