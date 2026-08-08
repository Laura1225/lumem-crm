import { createClient } from '@/lib/supabase/server'
import PropostasClient from '@/components/proposals/PropostasClient'

export default async function PropostasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const wsId = profile?.workspace_id!
  const [{ data: proposals }, { data: clients }] = await Promise.all([
    supabase.from('proposals').select('*, clients(id, name)').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').eq('workspace_id', wsId).order('name'),
  ])
  return <PropostasClient initialData={proposals || []} clients={clients || []} workspaceId={wsId} isAdmin={profile?.role === 'admin'} />
}
