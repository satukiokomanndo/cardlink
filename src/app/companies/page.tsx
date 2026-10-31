export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { CompanyList } from '@/components/company/company-list'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <AppLayout title="会社管理">
      <CompanyList initialCompanies={companies ?? []} userId={user.id} />
    </AppLayout>
  )
}
