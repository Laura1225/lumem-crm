import { createClient } from '@/lib/supabase/server'
import PortfolioClient from '@/components/portfolio/PortfolioClient'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('workspace_id, role').eq('id', user.id).single()
  const { data: items } = await supabase.from('portfolio_items').select('*').eq('workspace_id', profile?.workspace_id!).order('created_at', { ascending: false })
  return <PortfolioClient initialItems={items || []} workspaceId={profile?.workspace_id!} isAdmin={profile?.role === 'admin'} />
}
