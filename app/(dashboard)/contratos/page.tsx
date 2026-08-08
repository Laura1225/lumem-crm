import { createClient } from '@/lib/supabase/server'
import ContratosClient from '@/components/contracts/ContratosClient'

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const wsId = profile?.workspace_id!
  const [{ data: contracts }, { data: clients }] = await Promise.all([
    supabase.from('contracts').select('*, clients(id, name)').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').eq('workspace_id', wsId).order('name'),
  ])
  return <ContratosClient initialData={contracts || []} clients={clients || []} workspaceId={wsId} isAdmin={profile?.role === 'admin'} />
}
