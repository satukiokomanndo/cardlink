export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import Link from 'next/link'
import { CreditCard, Plus, Search, Star, Clock, Building2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [cardsResult, favoritesResult, recentResult] = await Promise.all([
    supabase.from('business_cards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('business_cards').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_favorite', true),
    supabase.from('business_cards')
      .select('id, name, company_name, position, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const totalCards = cardsResult.count ?? 0
  const favoriteCards = favoritesResult.count ?? 0
  const recentCards = recentResult.data ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CardLink</h1>
            <p className="text-muted-foreground text-sm">名刺管理</p>
          </div>
          <Link
            href="/cards/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            名刺を追加
          </Link>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/cards" className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">名刺総数</span>
            </div>
            <p className="text-3xl font-bold">{totalCards}</p>
            <p className="text-xs text-muted-foreground mt-1">枚</p>
          </Link>
          <Link href="/cards?filter=favorite" className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">お気に入り</span>
            </div>
            <p className="text-3xl font-bold">{favoriteCards}</p>
            <p className="text-xs text-muted-foreground mt-1">枚</p>
          </Link>
        </div>

        {/* クイックアクション */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/cards/new', icon: Plus, label: '名刺を登録', color: 'text-blue-600 bg-blue-100' },
              { href: '/cards/scan', icon: Search, label: 'スキャン読取', color: 'text-green-600 bg-green-100' },
              { href: '/cards', icon: CreditCard, label: '名刺一覧', color: 'text-purple-600 bg-purple-100' },
              { href: '/mycard', icon: Star, label: 'マイ名刺', color: 'text-orange-600 bg-orange-100' },
              { href: '/companies', icon: Building2, label: '会社管理', color: 'text-indigo-600 bg-indigo-100' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 最近の名刺 */}
        {recentCards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                最近更新した名刺
              </h2>
              <Link href="/cards" className="text-sm text-primary hover:underline">
                すべて見る
              </Link>
            </div>
            <div className="space-y-2">
              {recentCards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {card.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{card.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[card.company_name, card.position].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {totalCards === 0 && (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">名刺を登録してみましょう</h3>
            <p className="text-sm text-muted-foreground mb-6">カメラで撮影または手動入力で名刺を追加できます</p>
            <Link
              href="/cards/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              最初の名刺を追加
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
