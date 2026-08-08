'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Link from 'next/link'

interface Props {
  userName: string
  workspaceName: string
  pageTitle: string
  pageSubtitle?: string
  children: React.ReactNode
}

export default function DashboardShell({ userName, workspaceName, pageTitle, pageSubtitle, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app" style={{ display: 'flex', position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        userName={userName}
        workspaceName={workspaceName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 40px' }}>
        {/* Header row */}
        <div className="header-row">
          <div>
            <h1>{pageTitle}</h1>
            {pageSubtitle && <p>{pageSubtitle}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile menu button */}
            <button
              className="hdr-btn"
              style={{ display: 'none' }}
              onClick={() => setMobileOpen(true)}
              id="mobileMenuBtn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <Link href="/configuracoes" className="hdr-btn" title="Configurações">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </Link>
            <div
              className="avatar-corner"
              style={{ cursor: 'default' }}
              title={userName}
            >
              <div className="avatar-ring" style={{ opacity: 0 }}></div>
              <div className="avatar-circle">
                <span className="avatar-initials">
                  {userName ? userName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() : 'L'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="section active">
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          #mobileMenuBtn { display: flex !important; }
        }
        .avatar-initials { font-size: 13px; font-weight: 700; color: #fff; }
      `}</style>
    </div>
  )
}
