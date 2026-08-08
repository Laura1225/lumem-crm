'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PortfolioItem } from '@/lib/types'
import { Plus, Trash2, Pencil, Image } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { compressImage } from '@/lib/utils'

interface Props { initialItems: PortfolioItem[]; workspaceId: string; isAdmin: boolean }
const emptyForm = { title: '', description: '', image_url: '', tags: '', client_name: '' }

export default function PortfolioClient({ initialItems, workspaceId, isAdmin }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioItem | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true) }
  function openEdit(item: PortfolioItem) {
    setEditing(item)
    setForm({ title: item.title, description: item.description || '', image_url: item.image_url || '', tags: item.tags?.join(', ') || '', client_name: item.client_name || '' })
    setModalOpen(true)
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file, 1200, 0.85)
    setForm(f => ({ ...f, image_url: compressed }))
    e.target.value = ''
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const payload = { workspace_id: workspaceId, title: form.title, description: form.description || null, image_url: form.image_url || null, tags, client_name: form.client_name || null }
    if (editing) {
      const { data } = await supabase.from('portfolio_items').update(payload).eq('id', editing.id).select().single()
      if (data) setItems(is => is.map(i => i.id === editing.id ? data : i))
    } else {
      const { data } = await supabase.from('portfolio_items').insert(payload).select().single()
      if (data) setItems(is => [data, ...is])
    }
    setSaving(false); setModalOpen(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setItems(is => is.filter(i => i.id !== id)); setDeleteId(null)
  }

  return (
    <div>
      <PageHeader title="Portfólio" description={`${items.length} projeto${items.length !== 1 ? 's' : ''}`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo projeto</button>} />

      {items.length === 0 ? (
        <EmptyState icon="🎨" title="Portfólio vazio" description="Adicione seus melhores projetos." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Adicionar projeto</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="card p-0 overflow-hidden group hover:border-bg-hover transition-all">
              <div className="h-48 bg-bg-hover relative overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center h-full"><Image size={32} className="text-text-muted" /></div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(item)} className="btn-secondary text-xs px-3 py-1.5"><Pencil size={12} />Editar</button>
                  {isAdmin && <button onClick={() => setDeleteId(item.id)} className="btn-danger text-xs px-3 py-1.5"><Trash2 size={12} />Excluir</button>}
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-text-primary font-semibold text-sm mb-0.5">{item.title}</h3>
                {item.client_name && <p className="text-text-muted text-xs mb-1">{item.client_name}</p>}
                {item.description && <p className="text-text-secondary text-xs line-clamp-2">{item.description}</p>}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(t => <span key={t} className="badge bg-accent-purple/10 text-accent-purple text-[10px]">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar projeto' : 'Novo projeto'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar'}</button></>}>
        <div className="space-y-3">
          <div>
            <label className="label">Imagem</label>
            {form.image_url ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={form.image_url} className="w-full h-32 object-cover" alt="" />
                <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Remover</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-bg-border rounded-lg cursor-pointer hover:border-accent-purple/30 transition-colors">
                <Image size={20} className="text-text-muted mb-1" />
                <span className="text-text-muted text-xs">Clique para adicionar imagem</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
            )}
          </div>
          <div><label className="label">Título *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nome do projeto" /></div>
          <div><label className="label">Cliente</label><input className="input" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Nome do cliente" /></div>
          <div><label className="label">Descrição</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o projeto..." /></div>
          <div><label className="label">Tags (separadas por vírgula)</label><input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="branding, logo, identidade..." /></div>
        </div>
      </Modal>
      <Confirm open={!!deleteId} title="Excluir projeto?" message="Essa ação não pode ser desfeita." onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
