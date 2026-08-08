import { createClient } from '@/lib/supabase/server'
import CrmClient from '@/components/crm/CrmClient'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const { data: contacts } = await supabase.from('crm_contacts').select('*').eq('workspace_id', profile?.workspace_id!).order('created_at', { ascending: false })
  return <CrmClient initialData={contacts || []} workspaceId={profile?.workspace_id!} isAdmin={profile?.role === 'admin'} />
}
