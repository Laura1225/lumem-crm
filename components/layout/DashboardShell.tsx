'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

interface Props {
  userName: string
  workspaceName: string
  children: React.ReactNode
}

export default function DashboardShell({ userName, workspaceName, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar
        userName={userName}
        workspaceName={workspaceName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-56 transition-all duration-300 min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-bg-border bg-bg-card sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <span className="text-text-primary font-semibold">Lumem CRM</span>
        </div>

        <div className="p-4 lg:p-6 fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
