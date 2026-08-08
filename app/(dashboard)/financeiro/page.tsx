import { createClient } from '@/lib/supabase/server'
import FinanceiroClient from '@/components/financial/FinanceiroClient'

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const wsId = profile?.workspace_id!
  const [{ data: financial }, { data: clients }] = await Promise.all([
    supabase.from('financial').select('*, clients(id, name)').eq('workspace_id', wsId).order('date', { ascending: false }),
    supabase.from('clients').select('id, name').eq('workspace_id', wsId).order('name'),
  ])
  return <FinanceiroClient initialData={financial || []} clients={clients || []} workspaceId={wsId} isAdmin={profile?.role === 'admin'} />
}
