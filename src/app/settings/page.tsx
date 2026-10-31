export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { count: cardCount } = await supabase
    .from('business_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <AppLayout title="設定">
      <SettingsClient user={{ email: user.email ?? '' }} cardCount={cardCount ?? 0} />
    </AppLayout>
  )
}
