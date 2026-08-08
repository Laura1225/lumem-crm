import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, workspace_id, workspaces(name)')
    .eq('id', user.id)
    .single()

  const workspaceName = (profile?.workspaces as any)?.name || 'Meu Estúdio'
  const userName = profile?.name || user.email?.split('@')[0] || 'Usuário'

  return (
    <DashboardShell userName={userName} workspaceName={workspaceName}>
      {children}
    </DashboardShell>
  )
}
