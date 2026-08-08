import { createClient } from '@/lib/supabase/server'
import PastasClient from '@/components/folders/PastasClient'

export default async function PastasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const wsId = profile?.workspace_id!

  const [{ data: folders }, { data: clients }] = await Promise.all([
    supabase.from('client_folders').select('*, clients(id, name, avatar, status)').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name, avatar, status').eq('workspace_id', wsId).order('name'),
  ])

  return <PastasClient initialFolders={folders || []} clients={clients || []} workspaceId={wsId} isAdmin={profile?.role === 'admin'} />
}
