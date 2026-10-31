import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CreditCard, Search, Share2, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CardLink</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              ログイン
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-blue-500 hover:bg-blue-600">
              無料で始める
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-20 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            名刺管理を、<br />
            <span className="text-blue-400">スマートに。</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            CardLinkは、ビジネスの名刺を効率的に管理するためのWebアプリです。
            スキャン、検索、共有までをシームレスに実現します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8">
                今すぐ始める（無料）
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8">
                ログイン
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: CreditCard, title: '名刺スキャン', desc: 'カメラで撮影してOCR認識。情報を自動入力' },
            { icon: Search, title: '五十音検索', desc: 'ふりがな・会社名・タグで素早く検索' },
            { icon: Share2, title: 'PDF・画像出力', desc: 'PDF/JPG/PNGで出力・共有' },
            { icon: Shield, title: 'セキュア管理', desc: 'Supabase認証でデータを安全に保護' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <feature.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="text-center py-8 text-slate-500 text-sm">
        <p>© 2024 CardLink. All rights reserved.</p>
      </footer>
    </div>
  )
}
