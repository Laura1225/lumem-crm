import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/demands/KanbanBoard'

export default async function DemandasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const wsId = profile?.workspace_id!

  const [{ data: columns }, { data: demands }, { data: clients }] = await Promise.all([
    supabase.from('demand_columns').select('*').eq('workspace_id', wsId).order('position'),
    supabase.from('demands').select('*, clients(id, name, avatar)').eq('workspace_id', wsId).order('position'),
    supabase.from('clients').select('id, name, avatar').eq('workspace_id', wsId).eq('status', 'ativo').order('name'),
  ])

  return <KanbanBoard initialColumns={columns || []} initialDemands={demands || []} clients={clients || []} workspaceId={wsId} isAdmin={profile?.role === 'admin'} />
}
