'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CrmContact } from '@/lib/types'
import { Plus, Trash2, Pencil } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { formatCurrency, getInitials } from '@/lib/utils'

interface Props { initialData: CrmContact[]; workspaceId: string; isAdmin: boolean }

const STAGES = ['lead', 'contato', 'proposta', 'negociação', 'fechado', 'perdido']
const STAGE_COLORS: Record<string, string> = {
  lead: '#9898b0', contato: '#3b82f6', proposta: '#f59e0b', negociação: '#a855f7', fechado: '#22c55e', perdido: '#ef4444'
}

const emptyForm = { name: '', email: '', phone: '', company: '', stage: 'lead', notes: '', value: '' }

export default function CrmClient({ initialData, workspaceId, isAdmin }: Props) {
  const [data, setData] = useState<CrmContact[]>(initialData)
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CrmContact | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const byStage = useMemo(() => {
    const map: Record<string, CrmContact[]> = {}
    STAGES.forEach(s => { map[s] = data.filter(c => c.stage === s) })
    return map
  }, [data])

  function openCreate(stage = 'lead') { setEditing(null); setForm({ ...emptyForm, stage }); setModalOpen(true) }
  function openEdit(c: CrmContact) {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', stage: c.stage, notes: c.notes || '', value: c.value?.toString() || '' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { workspace_id: workspaceId, name: form.name, email: form.email || null, phone: form.phone || null, company: form.company || null, stage: form.stage, notes: form.notes || null, value: form.value ? Number(form.value) : null }
    if (editing) {
      const { data: row } = await supabase.from('crm_contacts').update(payload).eq('id', editing.id).select().single()
      if (row) setData(d => d.map(c => c.id === editing.id ? row : c))
    } else {
      const { data: row } = await supabase.from('crm_contacts').insert(payload).select().single()
      if (row) setData(d => [row, ...d])
    }
    setSaving(false); setModalOpen(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('crm_contacts').delete().eq('id', id)
    setData(d => d.filter(c => c.id !== id)); setDeleteId(null)
  }

  async function moveStage(contact: CrmContact, stage: string) {
    await supabase.from('crm_contacts').update({ stage }).eq('id', contact.id)
    setData(d => d.map(c => c.id === contact.id ? { ...c, stage } : c))
  }

  return (
    <div>
      <PageHeader title="CRM — Pipeline" description="Acompanhe seus leads e negociações"
        action={<><button onClick={() => setView(v => v === 'pipeline' ? 'list' : 'pipeline')} className="btn-secondary text-sm">{view === 'pipeline' ? 'Ver lista' : 'Ver pipeline'}</button><button onClick={() => openCreate()} className="btn-primary"><Plus size={16} />Novo contato</button></>} />

      {data.length === 0 ? (
        <EmptyState icon="📊" title="Pipeline vazio" description="Adicione leads e acompanhe o funil de vendas." action={<button onClick={() => openCreate()} className="btn-primary"><Plus size={16} />Novo contato</button>} />
      ) : view === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage} className="flex-shrink-0 w-60">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STAGE_COLORS[stage] }} />
                <span className="text-text-primary font-semibold text-sm capitalize">{stage}</span>
                <span className="badge bg-bg-hover text-text-muted text-xs ml-auto">{byStage[stage]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {byStage[stage]?.map(c => (
                  <div key={c.id} className="card hover:border-bg-hover transition-all cursor-pointer" onClick={() => openEdit(c)}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple">
                        {getInitials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-xs font-semibold truncate">{c.name}</p>
                        {c.company && <p className="text-text-muted text-[10px] truncate">{c.company}</p>}
                      </div>
                    </div>
                    {c.value && <p className="text-accent-green text-xs font-medium">{formatCurrency(c.value)}</p>}
                    <div className="flex gap-1 mt-2">
                      {STAGES.filter(s => s !== stage).slice(0, 2).map(s => (
                        <button key={s} onClick={e => { e.stopPropagation(); moveStage(c, s) }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-bg-hover text-text-muted hover:text-text-primary transition-colors capitalize">
                          → {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => openCreate(stage)} className="w-full text-text-muted text-xs py-2 border border-dashed border-bg-border rounded-lg hover:border-accent-purple/30 hover:text-text-secondary transition-all flex items-center justify-center gap-1">
                  <Plus size={12} /> Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-bg-border">
                {['Nome', 'Empresa', 'Etapa', 'Valor', 'Contato', 'Ações'].map(h => <th key={h} className="table-cell text-left text-text-muted font-medium text-xs">{h}</th>)}
              </tr></thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell text-text-primary font-medium text-sm">{c.name}</td>
                    <td className="table-cell text-text-secondary text-sm">{c.company || '—'}</td>
                    <td className="table-cell"><span className="badge text-xs capitalize" style={{ background: STAGE_COLORS[c.stage] + '18', color: STAGE_COLORS[c.stage] }}>{c.stage}</span></td>
                    <td className="table-cell text-text-primary text-sm">{c.value ? formatCurrency(c.value) : '—'}</td>
                    <td className="table-cell text-text-secondary text-xs">{c.email || c.phone || '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar contato' : 'Novo contato'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
        <div className="space-y-3">
          <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do lead" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
            <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Empresa</label><input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nome da empresa" /></div>
            <div><label className="label">Valor potencial</label><input className="input" type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" /></div>
          </div>
          <div><label className="label">Etapa</label>
            <select className="select" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
              {STAGES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div><label className="label">Notas</label><textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Informações relevantes..." /></div>
        </div>
      </Modal>
      <Confirm open={!!deleteId} title="Excluir contato?" message="Essa ação não pode ser desfeita." onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
