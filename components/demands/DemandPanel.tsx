'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Demand, DemandColumn, Client } from '@/lib/types'
import { X, Trash2, Image as ImageIcon, Calendar, Flag, Tag, AlignLeft, User } from 'lucide-react'
import ImageCropModal from '@/components/ui/ImageCropModal'
import Confirm from '@/components/ui/Confirm'
import { priorityLabels, compressImage } from '@/lib/utils'

interface DemandWithClient extends Demand {
  clients?: Pick<Client, 'id' | 'name' | 'avatar'> | null
}

interface Props {
  demand: DemandWithClient
  columns: DemandColumn[]
  clients: Pick<Client, 'id' | 'name' | 'avatar'>[]
  workspaceId: string
  onClose: () => void
  onSave: (d: DemandWithClient) => void
  onDelete: () => void
}

export default function DemandPanel({ demand, columns, clients, workspaceId, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState({
    title: demand.title,
    description: demand.description || '',
    column_id: demand.column_id,
    client_id: demand.client_id || '',
    priority: demand.priority,
    due_date: demand.due_date || '',
    tags: demand.tags?.join(', ') || '',
    cover_image: demand.cover_image || '',
  })
  const [cropUrl, setCropUrl] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const payload = {
      title: form.title,
      description: form.description || null,
      column_id: form.column_id,
      client_id: form.client_id || null,
      priority: form.priority,
      due_date: form.due_date || null,
      tags,
      cover_image: form.cover_image || null,
    }
    const { data } = await supabase.from('demands').update(payload).eq('id', demand.id).select('*, clients(id, name, avatar)').single()
    setSaving(false)
    if (data) onSave(data as DemandWithClient)
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file, 1200, 0.9)
    setCropUrl(dataUrl)
    e.target.value = ''
  }

  function handleCropApply(dataUrl: string) {
    setForm(f => ({ ...f, cover_image: dataUrl }))
    setCropUrl(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-bg-card border-l border-bg-border z-50 flex flex-col shadow-modal slide-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-bg-border">
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
          <h2 className="text-text-primary font-semibold text-sm flex-1 truncate">{demand.title}</h2>
          <button onClick={() => setConfirmDelete(true)} className="btn-ghost p-1.5 rounded-lg hover:text-accent-red"><Trash2 size={16} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Cover image */}
          <div>
            {form.cover_image ? (
              <div className="relative rounded-lg overflow-hidden group">
                <img src={form.cover_image} className="w-full h-44 object-cover" alt="Capa" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs">Trocar</button>
                  <button onClick={() => setForm(f => ({ ...f, cover_image: '' }))} className="btn-danger text-xs">Remover</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-bg-border rounded-lg flex flex-col items-center justify-center gap-1.5 text-text-muted hover:text-text-secondary hover:border-accent-purple/30 transition-all"
              >
                <ImageIcon size={18} />
                <span className="text-xs">Adicionar imagem de capa</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
          </div>

          {/* Title */}
          <div>
            <label className="label">Título</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          {/* Description */}
          <div>
            <label className="label flex items-center gap-1.5"><AlignLeft size={12} />Descrição</label>
            <textarea className="input resize-none" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva a demanda..." />
          </div>

          {/* Column */}
          <div>
            <label className="label">Coluna</label>
            <select className="select" value={form.column_id} onChange={e => setForm(f => ({ ...f, column_id: e.target.value }))}>
              {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="label flex items-center gap-1.5"><User size={12} />Cliente</label>
            <select className="select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">Sem cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="label flex items-center gap-1.5"><Flag size={12} />Prioridade</label>
              <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={12} />Prazo</label>
              <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label flex items-center gap-1.5"><Tag size={12} />Tags (separadas por vírgula)</label>
            <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="design, identidade, urgente..." />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-bg-border flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Crop modal */}
      {cropUrl && (
        <ImageCropModal open={!!cropUrl} imageUrl={cropUrl} onApply={handleCropApply} onClose={() => setCropUrl(null)} />
      )}

      <Confirm open={confirmDelete} title="Excluir demanda?" message="Essa ação não pode ser desfeita." onConfirm={() => { onDelete(); setConfirmDelete(false) }} onCancel={() => setConfirmDelete(false)} />
    </>
  )
}
