import { createClient } from '@/lib/supabase/server'
import ConfiguracoesClient from '@/components/ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*, workspaces(*)').eq('id', user.id).single()
  const { data: members } = await supabase.from('profiles').select('id, name, email, role, created_at').eq('workspace_id', profile?.workspace_id!).order('created_at')
  return <ConfiguracoesClient profile={profile} members={members || []} userId={user.id} />
}
