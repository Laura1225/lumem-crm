import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Users, KanbanSquare, DollarSign, TrendingUp, Activity } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  const wsId = profile?.workspace_id

  const [
    { count: totalClients },
    { count: activeClients },
    { data: demands },
    { data: financial },
    { data: activities },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId!),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId!).eq('status', 'ativo'),
    supabase.from('demands').select('column_id, demand_columns(title)').eq('workspace_id', wsId!),
    supabase.from('financial').select('type, amount, status').eq('workspace_id', wsId!),
    supabase.from('activities').select('icon, section, action, detail, created_at').eq('workspace_id', wsId!).order('created_at', { ascending: false }).limit(12),
  ])

  const activeDemands = demands?.length || 0
  const totalRevenue = financial?.filter(f => f.type === 'receita' && f.status === 'pago').reduce((s, f) => s + Number(f.amount), 0) || 0
  const pendingRevenue = financial?.filter(f => f.type === 'receita' && f.status === 'pendente').reduce((s, f) => s + Number(f.amount), 0) || 0

  const stats = [
    { label: 'Total de Clientes', value: totalClients ?? 0, sub: `${activeClients ?? 0} ativos`, icon: Users, color: '#a855f7' },
    { label: 'Demandas Ativas', value: activeDemands, sub: 'no kanban', icon: KanbanSquare, color: '#3b82f6' },
    { label: 'Receita Confirmada', value: formatCurrency(totalRevenue), sub: 'pagamentos recebidos', icon: DollarSign, color: '#22c55e' },
    { label: 'A Receber', value: formatCurrency(pendingRevenue), sub: 'pagamentos pendentes', icon: TrendingUp, color: '#f59e0b' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-0.5">Visão geral do seu estúdio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card hover:border-bg-hover transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: color + '18' }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-text-primary mb-0.5">{value}</div>
            <div className="text-text-secondary text-xs">{label}</div>
            <div className="text-text-muted text-xs mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-accent-purple" />
          <h2 className="text-text-primary font-semibold text-sm">Atividade Recente</h2>
        </div>

        {!activities?.length ? (
          <p className="text-text-muted text-sm text-center py-8">Nenhuma atividade ainda.</p>
        ) : (
          <div className="space-y-1">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-bg-border last:border-0">
                <span className="text-base leading-none mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-text-secondary text-sm">{a.action}</span>
                  {a.detail && <span className="text-text-primary text-sm font-medium"> — {a.detail}</span>}
                </div>
                <span className="text-text-muted text-xs whitespace-nowrap">{formatDateTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
