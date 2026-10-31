export const instant = false

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import Link from 'next/link'
import { Building2, Phone, Mail, Globe, MapPin, Users, ChevronLeft } from 'lucide-react'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [companyResult, cardsResult] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('business_cards').select('id, name, position, department').eq('company_id', id).eq('user_id', user.id),
  ])

  if (!companyResult.data) notFound()
  const company = companyResult.data
  const cards = cardsResult.data ?? []

  return (
    <AppLayout>
      <div className="space-y-4 pb-8">
        <Link href="/companies" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
          会社一覧に戻る
        </Link>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{company.name}</h1>
              {company.name_kana && <p className="text-sm text-muted-foreground">{company.name_kana}</p>}
              {company.industry && <p className="text-sm text-muted-foreground mt-1">{company.industry}</p>}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {company.phone && (
            <a href={`tel:${company.phone}`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">電話番号</p>
                <p className="text-sm font-medium text-primary">{company.phone}</p>
              </div>
            </a>
          )}
          {company.email && (
            <a href={`mailto:${company.email}`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">メール</p>
                <p className="text-sm font-medium text-primary">{company.email}</p>
              </div>
            </a>
          )}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 hover:bg-muted/50">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Webサイト</p>
                <p className="text-sm font-medium text-primary truncate">{company.website}</p>
              </div>
            </a>
          )}
          {company.address && (
            <div className="flex items-start gap-3 p-4">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">住所</p>
                <p className="text-sm">{company.postal_code && `〒${company.postal_code} `}{company.address}</p>
              </div>
            </div>
          )}
        </div>

        {company.memo && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-medium mb-2">メモ</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.memo}</p>
          </div>
        )}

        {/* 所属人物 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            所属人物 ({cards.length}名)
          </h2>
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              この会社に紐付いた名刺がありません
            </p>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {card.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{card.name}</p>
                    {(card.department || card.position) && (
                      <p className="text-xs text-muted-foreground">
                        {[card.department, card.position].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
