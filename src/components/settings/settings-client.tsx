'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  LogOut, Download, Upload, CreditCard, User, Shield,
  ChevronRight, FileSpreadsheet
} from 'lucide-react'
import { CSVExportImport } from './csv-export-import'

interface Props {
  user: { email: string }
  cardCount: number
}

export function SettingsClient({ user, cardCount }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [showCSV, setShowCSV] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  if (showCSV) {
    return <CSVExportImport onBack={() => setShowCSV(false)} />
  }

  return (
    <div className="space-y-6">
      {/* ユーザー情報 */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user.email}</p>
            <p className="text-sm text-muted-foreground">{cardCount}枚の名刺を管理中</p>
          </div>
        </div>
      </div>

      {/* データ管理 */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">データ管理</p>
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          <button
            onClick={() => setShowCSV(true)}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
          >
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">CSVエクスポート・インポート</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left opacity-50 cursor-not-allowed">
            <Download className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">バックアップをダウンロード</p>
              <p className="text-xs text-muted-foreground">データをJSON形式で保存</p>
            </div>
          </button>
        </div>
      </div>

      {/* セキュリティ */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">セキュリティ</p>
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Shield className="w-4 h-4 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">データ保護</p>
              <p className="text-xs text-muted-foreground">Supabase RLSで保護されています</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Shield className="w-4 h-4 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">通信の暗号化</p>
              <p className="text-xs text-muted-foreground">HTTPS/TLSで保護されています</p>
            </div>
          </div>
        </div>
      </div>

      {/* アプリ情報 */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">アプリ情報</p>
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">CardLink</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* ログアウト */}
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4" />
        ログアウト
      </Button>
    </div>
  )
}
