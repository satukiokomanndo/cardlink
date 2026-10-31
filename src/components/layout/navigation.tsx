'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CreditCard, Plus, Tag, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/cards', label: '名刺一覧', icon: CreditCard },
  { href: '/cards/new', label: '名刺登録', icon: Plus },
  { href: '/tags', label: 'タグ', icon: Tag },
  { href: '/settings', label: '設定', icon: Settings },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="max-w-screen-lg mx-auto">
        <ul className="flex items-stretch h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center h-full gap-1 text-xs transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.href === '/cards/new' ? (
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                  ) : (
                    <>
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export function SideNavigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex flex-col w-60 min-h-screen border-r border-border bg-background p-4">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-primary tracking-tight">CardLink</h1>
        <p className="text-xs text-muted-foreground mt-1">名刺管理アプリ</p>
      </div>
      <ul className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
