'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Contract, Client } from '@/lib/types'
import { Plus, Trash2, Eye, Pencil } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { formatCurrency, formatDate, statusColors } from '@/lib/utils'

interface ContractWithClient extends Contract { clients?: Pick<Client, 'id' | 'name'> | null }
interface Props { initialData: ContractWithClient[]; clients: Pick<Client, 'id' | 'name'>[]; workspaceId: string; isAdmin: boolean }
const emptyForm = { title: '', content: '', value: '', status: 'aguardando' as const, client_id: '', signed_at: '' }

export default function ContratosClient({ initialData, clients, workspaceId, isAdmin }: Props) {
  const [data, setData] = useState<ContractWithClient[]>(initialData)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState<ContractWithClient | null>(null)
  const [editing, setEditing] = useState<ContractWithClient | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true) }
  function openEdit(c: ContractWithClient) {
    setEditing(c)
    setForm({ title: c.title, content: c.content || '', value: c.value?.toString() || '', status: c.status, client_id: c.client_id || '', signed_at: c.signed_at || '' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { workspace_id: workspaceId, title: form.title, content: form.content || null, value: form.value ? Number(form.value) : null, status: form.status, client_id: form.client_id || null, signed_at: form.signed_at || null }
    if (editing) {
      const { data: row } = await supabase.from('contracts').update(payload).eq('id', editing.id).select('*, clients(id, name)').single()
      if (row) setData(d => d.map(c => c.id === editing.id ? row as ContractWithClient : c))
    } else {
      const { data: row } = await supabase.from('contracts').insert(payload).select('*, clients(id, name)').single()
      if (row) setData(d => [row as ContractWithClient, ...d])
    }
    setSaving(false); setModalOpen(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('contracts').delete().eq('id', id)
    setData(d => d.filter(c => c.id !== id)); setDeleteId(null)
  }

  const sb = (s: string) => ({ background: (statusColors[s] || '#9898b0') + '18', color: statusColors[s] || '#9898b0' })

  return (
    <div>
      <PageHeader title="Contratos" description={`${data.length} contrato${data.length !== 1 ? 's' : ''}`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo contrato</button>} />

      {data.length === 0 ? (
        <EmptyState icon="📝" title="Nenhum contrato" description="Formalize seus projetos com contratos." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo contrato</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-bg-border">
                {['Título', 'Cliente', 'Valor', 'Status', 'Assinatura', 'Ações'].map(h => <th key={h} className="table-cell text-left text-text-muted font-medium text-xs">{h}</th>)}
              </tr></thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell text-text-primary font-medium text-sm">{c.title}</td>
                    <td className="table-cell text-text-secondary text-sm">{c.clients?.name || '—'}</td>
                    <td className="table-cell text-text-primary text-sm">{c.value ? formatCurrency(c.value) : '—'}</td>
                    <td className="table-cell"><span className="badge text-xs" style={sb(c.status)}>{c.status}</span></td>
                    <td className="table-cell text-text-secondary text-sm">{c.signed_at ? formatDate(c.signed_at) : '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => setViewModal(c)} className="btn-ghost p-1.5 rounded-lg"><Eye size={14} /></button>
                        <button onClick={() => openEdit(c)} className="btn-ghost p-1.5 rounded-lg"><Pencil size={14} /></button>
                        {isAdmin && <button onClick={() => setDeleteId(c.id)} className="btn-ghost p-1.5 rounded-lg hover:text-accent-red"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal.title} size="lg"
          footer={<><button onClick={() => { openEdit(viewModal); setViewModal(null) }} className="btn-secondary"><Pencil size={14} />Editar</button><button onClick={() => setViewModal(null)} className="btn-primary">Fechar</button></>}>
          <div className="space-y-3">
            <div className="flex gap-4 flex-wrap">
              {viewModal.clients && <div><span className="label">Cliente</span><p className="text-text-primary text-sm">{viewModal.clients.name}</p></div>}
              {viewModal.value && <div><span className="label">Valor</span><p className="text-text-primary text-sm font-semibold">{formatCurrency(viewModal.value)}</p></div>}
              <div><span className="label">Status</span><span className="badge text-xs mt-1.5" style={sb(viewModal.status)}>{viewModal.status}</span></div>
              {viewModal.signed_at && <div><span className="label">Assinado em</span><p className="text-text-primary text-sm">{formatDate(viewModal.signed_at)}</p></div>}
            </div>
            {viewModal.content && <div className="bg-bg-hover rounded-lg p-4 text-text-secondary text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">{viewModal.content}</div>}
          </div>
        </Modal>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar contrato' : 'Novo contrato'} size="lg"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
        <div className="space-y-3">
          <div><label className="label">Título *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Contrato de prestação de serviços" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cliente</label>
              <select className="select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">Sem cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Valor (R$)</label><input className="input" type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="aguardando">Aguardando</option><option value="ativo">Ativo</option><option value="encerrado">Encerrado</option>
              </select>
            </div>
            <div><label className="label">Data de assinatura</label><input className="input" type="date" value={form.signed_at} onChange={e => setForm(f => ({ ...f, signed_at: e.target.value }))} /></div>
          </div>
          <div><label className="label">Texto do contrato</label><textarea className="input resize-none" rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Cole ou escreva o conteúdo do contrato aqui..." /></div>
        </div>
      </Modal>
      <Confirm open={!!deleteId} title="Excluir contrato?" message="Essa ação não pode ser desfeita." onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
