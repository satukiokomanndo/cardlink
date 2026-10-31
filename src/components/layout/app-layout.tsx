'use client'

import { BottomNavigation, SideNavigation } from './navigation'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  showBack?: boolean
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      <main className="flex-1 flex flex-col min-h-screen">
        {title && (
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center">
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </header>
        )}
        <div className="flex-1 max-w-screen-lg mx-auto w-full px-4 py-4 pb-20 lg:pb-4">
          {children}
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
