import { createClient } from '@/lib/supabase/server'
import ClientsClient from '@/components/clients/ClientsClient'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('workspace_id', profile?.workspace_id!)
    .order('created_at', { ascending: false })

  return <ClientsClient initialClients={clients || []} workspaceId={profile?.workspace_id!} isAdmin={profile?.role === 'admin'} />
}
