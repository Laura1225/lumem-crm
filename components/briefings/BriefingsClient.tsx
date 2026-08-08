'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Briefing, Client } from '@/lib/types'
import { Plus, Trash2, Eye, Pencil } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { formatDate } from '@/lib/utils'

const BRIEFING_QUESTIONS = [
  { key: 'objetivo', label: 'Qual o objetivo do projeto?' },
  { key: 'publico', label: 'Quem é o público-alvo?' },
  { key: 'concorrentes', label: 'Quais são os concorrentes?' },
  { key: 'referencias', label: 'Tem referências visuais ou de estilo?' },
  { key: 'cores', label: 'Tem preferências de cores?' },
  { key: 'prazo', label: 'Qual o prazo esperado?' },
  { key: 'orcamento', label: 'Qual o orçamento disponível?' },
  { key: 'observacoes', label: 'Observações adicionais' },
]

interface BriefingWithClient extends Briefing { clients?: Pick<Client, 'id' | 'name'> | null }
interface Props { initialData: BriefingWithClient[]; clients: Pick<Client, 'id' | 'name'>[]; workspaceId: string; isAdmin: boolean }

export default function BriefingsClient({ initialData, clients, workspaceId, isAdmin }: Props) {
  const [data, setData] = useState<BriefingWithClient[]>(initialData)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState<BriefingWithClient | null>(null)
  const [editing, setEditing] = useState<BriefingWithClient | null>(null)
  const [form, setForm] = useState({ title: '', client_id: '', answers: {} as Record<string, string> })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function openCreate() { setEditing(null); setForm({ title: '', client_id: '', answers: {} }); setModalOpen(true) }
  function openEdit(b: BriefingWithClient) {
    setEditing(b)
    setForm({ title: b.title, client_id: b.client_id || '', answers: (b.answers as Record<string, string>) || {} })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { workspace_id: workspaceId, title: form.title, client_id: form.client_id || null, answers: form.answers }
    if (editing) {
      const { data: row } = await supabase.from('briefings').update(payload).eq('id', editing.id).select('*, clients(id, name)').single()
      if (row) setData(d => d.map(b => b.id === editing.id ? row as BriefingWithClient : b))
    } else {
      const { data: row } = await supabase.from('briefings').insert(payload).select('*, clients(id, name)').single()
      if (row) setData(d => [row as BriefingWithClient, ...d])
    }
    setSaving(false); setModalOpen(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('briefings').delete().eq('id', id)
    setData(d => d.filter(b => b.id !== id)); setDeleteId(null)
  }

  return (
    <div>
      <PageHeader title="Briefings" description={`${data.length} briefing${data.length !== 1 ? 's' : ''}`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo briefing</button>} />

      {data.length === 0 ? (
        <EmptyState icon="📋" title="Nenhum briefing" description="Capture todas as informações do projeto antes de começar." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo briefing</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(b => (
            <div key={b.id} className="card hover:border-bg-hover transition-all group">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">📋</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setViewModal(b)} className="btn-ghost p-1.5 rounded-lg"><Eye size={13} /></button>
                  <button onClick={() => openEdit(b)} className="btn-ghost p-1.5 rounded-lg"><Pencil size={13} /></button>
                  {isAdmin && <button onClick={() => setDeleteId(b.id)} className="btn-ghost p-1.5 rounded-lg hover:text-accent-red"><Trash2 size={13} /></button>}
                </div>
              </div>
              <h3 className="text-text-primary font-semibold text-sm mb-1">{b.title}</h3>
              {b.clients && <p className="text-text-secondary text-xs mb-1">{b.clients.name}</p>}
              <p className="text-text-muted text-xs">{formatDate(b.created_at)}</p>
              <div className="mt-2 pt-2 border-t border-bg-border">
                <p className="text-text-muted text-xs">{Object.values((b.answers as Record<string, string>) || {}).filter(Boolean).length} de {BRIEFING_QUESTIONS.length} perguntas respondidas</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal.title} size="lg"
          footer={<><button onClick={() => { openEdit(viewModal); setViewModal(null) }} className="btn-secondary"><Pencil size={14} />Editar</button><button onClick={() => setViewModal(null)} className="btn-primary">Fechar</button></>}>
          <div className="space-y-4">
            {viewModal.clients && <p className="text-text-secondary text-sm">Cliente: <span className="text-text-primary font-medium">{viewModal.clients.name}</span></p>}
            {BRIEFING_QUESTIONS.map(q => {
              const answer = (viewModal.answers as Record<string, string>)?.[q.key]
              if (!answer) return null
              return (
                <div key={q.key}>
                  <p className="text-text-secondary text-xs font-medium mb-1">{q.label}</p>
                  <p className="text-text-primary text-sm bg-bg-hover rounded-lg p-3">{answer}</p>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar briefing' : 'Novo briefing'} size="lg"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div><label className="label">Título *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Briefing - Identidade Visual Lumem" /></div>
          <div><label className="label">Cliente</label>
            <select className="select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">Sem cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {BRIEFING_QUESTIONS.map(q => (
            <div key={q.key}>
              <label className="label">{q.label}</label>
              <textarea className="input resize-none" rows={2} value={form.answers[q.key] || ''} onChange={e => setForm(f => ({ ...f, answers: { ...f.answers, [q.key]: e.target.value } }))} placeholder="Sua resposta..." />
            </div>
          ))}
        </div>
      </Modal>
      <Confirm open={!!deleteId} title="Excluir briefing?" message="Essa ação não pode ser desfeita." onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
