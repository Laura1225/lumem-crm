'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Financial, Client } from '@/lib/types'
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { formatCurrency, formatDate, statusColors } from '@/lib/utils'

interface FinancialWithClient extends Financial {
  clients?: Pick<Client, 'id' | 'name'> | null
}

interface Props {
  initialData: FinancialWithClient[]
  clients: Pick<Client, 'id' | 'name'>[]
  workspaceId: string
  isAdmin: boolean
}

const emptyForm = { type: 'receita' as const, description: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pendente' as const, client_id: '', category: '' }

export default function FinanceiroClient({ initialData, clients, workspaceId, isAdmin }: Props) {
  const [data, setData] = useState<FinancialWithClient[]>(initialData)
  const [filter, setFilter] = useState('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FinancialWithClient | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const filtered = useMemo(() => data.filter(f => filter === 'todos' || f.type === filter || f.status === filter), [data, filter])
  const totalReceita = data.filter(f => f.type === 'receita' && f.status === 'pago').reduce((s, f) => s + Number(f.amount), 0)
  const totalDespesa = data.filter(f => f.type === 'despesa' && f.status === 'pago').reduce((s, f) => s + Number(f.amount), 0)
  const saldo = totalReceita - totalDespesa
  const aPagar = data.filter(f => f.status === 'pendente').reduce((s, f) => s + Number(f.amount), 0)

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true) }
  function openEdit(f: FinancialWithClient) {
    setEditing(f)
    setForm({ type: f.type, description: f.description, amount: f.amount.toString(), date: f.date, status: f.status, client_id: f.client_id || '', category: f.category || '' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    const client = clients.find(c => c.id === form.client_id)
    const payload = { workspace_id: workspaceId, type: form.type, description: form.description, amount: Number(form.amount), date: form.date, status: form.status, client_id: form.client_id || null, category: form.category || null }
    if (editing) {
      const { data: row } = await supabase.from('financial').update(payload).eq('id', editing.id).select('*, clients(id, name)').single()
      if (row) setData(d => d.map(f => f.id === editing.id ? row as FinancialWithClient : f))
    } else {
      const { data: row } = await supabase.from('financial').insert(payload).select('*, clients(id, name)').single()
      if (row) setData(d => [row as FinancialWithClient, ...d])
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('financial').delete().eq('id', id)
    setData(d => d.filter(f => f.id !== id))
    setDeleteId(null)
  }

  const filterBtns = [{ k: 'todos', l: 'Todos' }, { k: 'receita', l: 'Receitas' }, { k: 'despesa', l: 'Despesas' }, { k: 'pendente', l: 'Pendentes' }, { k: 'pago', l: 'Pagos' }]

  return (
    <div>
      <PageHeader title="Financeiro" description="Controle de receitas e despesas"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo lançamento</button>} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Receita', value: formatCurrency(totalReceita), icon: TrendingUp, color: '#22c55e' },
          { label: 'Despesa', value: formatCurrency(totalDespesa), icon: TrendingDown, color: '#ef4444' },
          { label: 'Saldo', value: formatCurrency(saldo), icon: DollarSign, color: saldo >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'A Receber/Pagar', value: formatCurrency(aPagar), icon: DollarSign, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <span className="text-text-muted text-xs">{label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {filterBtns.map(({ k, l }) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === k ? 'bg-accent-purple text-white' : 'bg-bg-hover text-text-secondary hover:text-text-primary'}`}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="💰" title="Nenhum lançamento" description="Registre receitas e despesas do seu estúdio." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo lançamento</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-bg-border">
                <th className="table-cell text-left text-text-muted font-medium text-xs">Descrição</th>
                <th className="table-cell text-left text-text-muted font-medium text-xs">Tipo</th>
                <th className="table-cell text-left text-text-muted font-medium text-xs">Valor</th>
                <th className="table-cell text-left text-text-muted font-medium text-xs hidden md:table-cell">Data</th>
                <th className="table-cell text-left text-text-muted font-medium text-xs">Status</th>
                <th className="table-cell text-left text-text-muted font-medium text-xs hidden lg:table-cell">Cliente</th>
                <th className="table-cell text-right text-text-muted font-medium text-xs">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="table-row">
                    <td className="table-cell text-text-primary text-sm font-medium">{f.description}</td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${f.type === 'receita' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{f.type}</span>
                    </td>
                    <td className="table-cell font-semibold text-sm" style={{ color: f.type === 'receita' ? '#22c55e' : '#ef4444' }}>
                      {formatCurrency(Number(f.amount))}
                    </td>
                    <td className="table-cell text-text-secondary text-sm hidden md:table-cell">{formatDate(f.date)}</td>
                    <td className="table-cell">
                      <span className="badge text-xs" style={{ background: (statusColors[f.status] || '#9898b0') + '18', color: statusColors[f.status] || '#9898b0' }}>{f.status}</span>
                    </td>
                    <td className="table-cell text-text-secondary text-sm hidden lg:table-cell">{f.clients?.name || '—'}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(f)} className="btn-ghost p-1.5 rounded-lg"><Pencil size={14} /></button>
                        {isAdmin && <button onClick={() => setDeleteId(f.id)} className="btn-ghost p-1.5 rounded-lg hover:text-accent-red"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar lançamento' : 'Novo lançamento'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo</label>
              <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option value="receita">Receita</option><option value="despesa">Despesa</option>
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="pendente">Pendente</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div><label className="label">Descrição *</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Projeto identidade visual" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Valor (R$) *</label><input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" /></div>
            <div><label className="label">Data</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div><label className="label">Cliente</label>
            <select className="select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">Sem cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Categoria</label><input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Marketing, Design, Infraestrutura..." /></div>
        </div>
      </Modal>
      <Confirm open={!!deleteId} title="Excluir lançamento?" message="Essa ação não pode ser desfeita." onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
