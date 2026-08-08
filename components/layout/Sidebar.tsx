'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const navItems = [
  {
    href: '/dashboard', section: 'dashboard',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
    label: 'Dashboard'
  },
  {
    href: '/demandas', section: 'demandas',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    label: 'Demandas'
  },
  {
    href: '/clientes', section: 'clientes',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    label: 'Clientes'
  },
  {
    href: '/pastas', section: 'pastas',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
    label: 'Pastas'
  },
  {
    href: '/crm', section: 'crm',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="10" y="3" width="6" height="11" rx="1"/><rect x="17" y="3" width="4" height="7" rx="1"/></svg>,
    label: 'CRM'
  },
  {
    href: '/financeiro', section: 'financeiro',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-4"/></svg>,
    label: 'Financeiro'
  },
  {
    href: '/portfolio', section: 'portfolio',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    label: 'Portfólio'
  },
  {
    href: '/propostas', section: 'propostas',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></svg>,
    label: 'Propostas'
  },
  {
    href: '/briefings', section: 'briefings',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h6"/></svg>,
    label: 'Briefings'
  },
  {
    href: '/contratos', section: 'contratos',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M9 17l2 2 4-4"/></svg>,
    label: 'Contratos'
  },
  {
    href: '/configuracoes', section: 'configuracoes',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.51 1z"/></svg>,
    label: 'Configurações'
  },
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
  const [mini, setMini] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName ? userName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() : 'L'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} onClick={onMobileClose} />
      )}

      <div className={`app${mini ? ' sb-mini' : ''}`} style={{ position: 'static', width: 'auto', height: 'auto', display: 'block', overflow: 'visible', background: 'transparent' }}>
        <aside className="sidebar" style={mobileOpen ? { transform: 'translateX(0)', zIndex: 50 } : {}}>
          {/* Mini logo */}
          <div className="sb-mini-logo">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-red)', boxShadow: 'var(--glow-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>L</span>
            </div>
          </div>

          {/* Brand / Logo */}
          <div className="brand logo-lockup">
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--grad-red)', boxShadow: 'var(--glow-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>L</span>
            </div>
            <span className="logo-text">{workspaceName || 'LUMEM'}</span>
          </div>

          {/* Nav */}
          <nav id="mainNav">
            {navItems.map(({ href, section, svg, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onMobileClose}
                  className={`nav-item${active ? ' active' : ''}`}
                  data-section={section}
                >
                  {svg}
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom */}
          <div className="sidebar-bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,10,51,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} className="lc-name">
                {userName}
              </span>
            </div>
            <button className="sb-toggle" onClick={() => setMini(!mini)} title={mini ? 'Expandir' : 'Recolher'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              <span className="sb-toggle-label">Recolher</span>
            </button>
            <button className="logout-btn" onClick={handleLogout} style={{ width: '100%', marginTop: 6, cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
