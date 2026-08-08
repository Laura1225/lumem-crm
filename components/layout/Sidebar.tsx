'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FolderOpen, KanbanSquare,
  DollarSign, Image, FileText, BookOpen, ScrollText,
  BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clientes', icon: Users, label: 'Clientes' },
  { href: '/pastas', icon: FolderOpen, label: 'Pastas' },
  { href: '/demandas', icon: KanbanSquare, label: 'Demandas' },
  { href: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/portfolio', icon: Image, label: 'Portfólio' },
  { href: '/propostas', icon: FileText, label: 'Propostas' },
  { href: '/briefings', icon: BookOpen, label: 'Briefings' },
  { href: '/contratos', icon: ScrollText, label: 'Contratos' },
  { href: '/crm', icon: BarChart2, label: 'CRM' },
]

interface Props {
  userName: string
  workspaceName: string
  userAvatar?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ userName, workspaceName, userAvatar, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full bg-bg-card border-r border-bg-border flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
        'max-lg:translate-x-[-100%] max-lg:w-56',
        mobileOpen && 'max-lg:translate-x-0'
      )}>
        {/* Header */}
        <div className={cn('flex items-center h-16 px-3 border-b border-bg-border gap-3', collapsed && 'justify-center')}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-semibold text-sm truncate">{workspaceName}</p>
              <p className="text-text-muted text-xs truncate">CRM</p>
            </div>
          )}
          {/* Mobile close */}
          <button onClick={onMobileClose} className="lg:hidden btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all group',
                  active
                    ? 'bg-accent-purple/15 text-accent-purple'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-bg-border p-2 space-y-0.5">
          <Link
            href="/configuracoes"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all text-text-secondary hover:text-text-primary hover:bg-bg-hover',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Configurações' : undefined}
          >
            <Settings size={18} />
            {!collapsed && <span>Configurações</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all text-text-secondary hover:text-accent-red hover:bg-red-500/10',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Sair</span>}
          </button>

          {/* User info */}
          <div className={cn('flex items-center gap-2.5 px-2.5 py-2 mt-1', collapsed && 'justify-center')}>
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-purple/30 flex items-center justify-center text-xs font-bold text-accent-purple">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-xs font-medium truncate">{userName}</p>
              </div>
            )}
          </div>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center py-1.5 text-text-muted hover:text-text-secondary transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>
    </>
  )
}
