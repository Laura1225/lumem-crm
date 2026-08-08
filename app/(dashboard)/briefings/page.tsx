import { createClient } from '@/lib/supabase/server'
import BriefingsClient from '@/components/briefings/BriefingsClient'

export default async function BriefingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const wsId = profile?.workspace_id!
  const [{ data: briefings }, { data: clients }] = await Promise.all([
    supabase.from('briefings').select('*, clients(id, name)').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').eq('workspace_id', wsId).order('name'),
  ])
  return <BriefingsClient initialData={briefings || []} clients={clients || []} workspaceId={wsId} isAdmin={profile?.role === 'admin'} />
}
