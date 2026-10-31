export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { TagManager } from '@/components/tags/tag-manager'

export default async function TagsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, color, created_at')
    .eq('user_id', user.id)
    .order('name')

  // 各タグの使用数を取得
  const tagCounts: Record<string, number> = {}
  if (tags) {
    for (const tag of tags) {
      const { count } = await supabase
        .from('card_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tag.id)
      tagCounts[tag.id] = count ?? 0
    }
  }

  return (
    <AppLayout title="タグ管理">
      <TagManager tags={tags ?? []} tagCounts={tagCounts} />
    </AppLayout>
  )
}
