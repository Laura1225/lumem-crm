'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { Plus, Search, Trash2, Pencil, Phone, Mail } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { formatCurrency, getInitials, statusColors, compressImage } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  initialClients: Client[]
  workspaceId: string
  isAdmin: boolean
}

const emptyForm = {
  name: '', email: '', phone: '', type: 'freela' as 'freela' | 'mensal',
  status: 'ativo' as 'ativo' | 'inativo', monthly_value: '', notes: '', avatar: ''
}

export default function ClientsClient({ initialClients, workspaceId, isAdmin }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const filtered = useMemo(() => {
    return clients
      .filter(c => {
        const matchFilter =
          filter === 'todos' ? true :
          filter === 'ativo' ? c.status === 'ativo' :
          filter === 'inativo' ? c.status === 'inativo' :
          filter === 'mensal' ? c.type === 'mensal' :
          filter === 'freela' ? c.type === 'freela' : true
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
        return matchFilter && matchSearch
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [clients, search, filter])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  function openEdit(c: Client) {
    setEditing(c)
    setForm({
      name: c.name, email: c.email || '', phone: c.phone || '',
      type: c.type, status: c.status, monthly_value: c.monthly_value?.toString() || '',
      notes: c.notes || '', avatar: c.avatar || ''
    })
    setModalOpen(true)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file, 200, 0.8)
    setForm(f => ({ ...f, avatar: compressed }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      workspace_id: workspaceId,
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      type: form.type,
      status: form.status,
      monthly_value: form.monthly_value ? Number(form.monthly_value) : null,
      notes: form.notes || null,
      avatar: form.avatar || null,
    }

    if (editing) {
      const { data, error } = await supabase.from('clients').update(payload).eq('id', editing.id).select().single()
      if (!error && data) {
        setClients(cs => cs.map(c => c.id === editing.id ? data : c))
        // Log activity
        await supabase.from('activities').insert({ workspace_id: workspaceId, icon: '✏️', section: 'clientes', action: 'Cliente editado', detail: form.name })
      }
    } else {
      const { data, error } = await supabase.from('clients').insert(payload).select().single()
      if (!error && data) {
        setClients(cs => [data, ...cs])
        // Auto-create folder
        await supabase.from('client_folders').insert({ workspace_id: workspaceId, client_id: data.id, name: form.name.trim() })
        await supabase.from('activities').insert({ workspace_id: workspaceId, icon: '👤', section: 'clientes', action: 'Cliente adicionado', detail: form.name })
      }
    }
    setSaving(false)
    setModalOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const c = clients.find(x => x.id === id)
    await supabase.from('clients').delete().eq('id', id)
    setClients(cs => cs.filter(x => x.id !== id))
    if (c) await supabase.from('activities').insert({ workspace_id: workspaceId, icon: '🗑️', section: 'clientes', action: 'Cliente removido', detail: c.name })
    setDeleteId(null)
  }

  const filters = [
    { key: 'todos', label: 'Todos' },
    { key: 'ativo', label: 'Ativos' },
    { key: 'inativo', label: 'Inativos' },
    { key: 'mensal', label: 'Mensais' },
    { key: 'freela', label: 'Freela' },
  ]

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} cadastrado${clients.length !== 1 ? 's' : ''}`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Novo cliente</button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="input pl-8" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.key ? 'bg-accent-purple text-white' : 'bg-bg-hover text-text-secondary hover:text-text-primary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon="👤" title="Nenhum cliente encontrado" description="Adicione seu primeiro cliente para começar." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo cliente</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="table-cell text-left text-text-muted font-medium text-xs">Cliente</th>
                  <th className="table-cell text-left text-text-muted font-medium text-xs hidden md:table-cell">Contato</th>
                  <th className="table-cell text-left text-text-muted font-medium text-xs">Tipo</th>
                  <th className="table-cell text-left text-text-muted font-medium text-xs">Status</th>
                  <th className="table-cell text-left text-text-muted font-medium text-xs hidden lg:table-cell">Valor</th>
                  <th className="table-cell text-right text-text-muted font-medium text-xs">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img src={c.avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple flex-shrink-0">
                            {getInitials(c.name)}
                          </div>
                        )}
                        <span className="text-text-primary font-medium text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.email && <div className="flex items-center gap-1.5 text-text-secondary text-xs"><Mail size={11} />{c.email}</div>}
                        {c.phone && <div className="flex items-center gap-1.5 text-text-secondary text-xs"><Phone size={11} />{c.phone}</div>}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${c.type === 'mensal' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge" style={{ background: (statusColors[c.status] || '#9898b0') + '18', color: statusColors[c.status] || '#9898b0' }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-text-secondary text-sm">
                      {c.monthly_value ? formatCurrency(c.monthly_value) : '—'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar cliente'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-purple/20 flex items-center justify-center text-lg font-bold text-accent-purple overflow-hidden flex-shrink-0">
              {form.avatar ? <img src={form.avatar} className="w-full h-full object-cover" alt="" /> : getInitials(form.name || '?')}
            </div>
            <div>
              <label className="btn-secondary text-xs cursor-pointer">
                Escolher foto
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
              {form.avatar && <button onClick={() => setForm(f => ({ ...f, avatar: '' }))} className="ml-2 text-text-muted text-xs hover:text-accent-red">Remover</button>}
            </div>
          </div>

          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do cliente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option value="freela">Freela</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          {form.type === 'mensal' && (
            <div>
              <label className="label">Valor mensal (R$)</label>
              <input className="input" type="number" value={form.monthly_value} onChange={e => setForm(f => ({ ...f, monthly_value: e.target.value }))} placeholder="0,00" />
            </div>
          )}
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[80px] resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anotações sobre o cliente..." />
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!deleteId}
        title="Excluir cliente?"
        message="Essa ação não pode ser desfeita. A pasta do cliente também será removida."
        confirmLabel="Excluir"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
