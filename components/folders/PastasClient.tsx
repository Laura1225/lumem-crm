'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientFolder, Client } from '@/lib/types'
import { Plus, Search, Trash2, FolderOpen, Pencil } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { getInitials, formatDateTime } from '@/lib/utils'

interface FolderWithClient extends ClientFolder {
  clients?: Pick<Client, 'id' | 'name' | 'avatar' | 'status'> | null
}

interface Props {
  initialFolders: FolderWithClient[]
  clients: Pick<Client, 'id' | 'name' | 'avatar' | 'status'>[]
  workspaceId: string
  isAdmin: boolean
}

export default function PastasClient({ initialFolders, clients, workspaceId, isAdmin }: Props) {
  const [folders, setFolders] = useState<FolderWithClient[]>(initialFolders)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FolderWithClient | null>(null)
  const [form, setForm] = useState({ name: '', client_id: '', description: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const filtered = useMemo(() => {
    return folders.filter(f => {
      const clientName = f.clients?.name || ''
      return !search || f.name.toLowerCase().includes(search.toLowerCase()) || clientName.toLowerCase().includes(search.toLowerCase())
    })
  }, [folders, search])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', client_id: clients[0]?.id || '', description: '' })
    setModalOpen(true)
  }

  function openEdit(f: FolderWithClient) {
    setEditing(f)
    setForm({ name: f.name, client_id: f.client_id, description: f.description || '' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.client_id) return
    setSaving(true)
    const client = clients.find(c => c.id === form.client_id)
    const payload = { workspace_id: workspaceId, client_id: form.client_id, name: form.name.trim(), description: form.description || null }

    if (editing) {
      const { data } = await supabase.from('client_folders').update(payload).eq('id', editing.id).select('*, clients(id, name, avatar, status)').single()
      if (data) setFolders(fs => fs.map(f => f.id === editing.id ? data as FolderWithClient : f))
    } else {
      const { data } = await supabase.from('client_folders').insert(payload).select('*, clients(id, name, avatar, status)').single()
      if (data) setFolders(fs => [data as FolderWithClient, ...fs])
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('client_folders').delete().eq('id', id)
    setFolders(fs => fs.filter(f => f.id !== id))
    setDeleteId(null)
  }

  return (
    <div>
      <PageHeader
        title="Pastas"
        description="Organize os arquivos de cada cliente"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nova pasta</button>}
      />

      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input className="input pl-8" placeholder="Buscar pastas..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📁" title="Nenhuma pasta encontrada" description="As pastas são criadas automaticamente ao adicionar um cliente." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nova pasta</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(folder => {
            const c = folder.clients
            return (
              <div key={folder.id} className="card hover:border-bg-hover transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-accent-purple/10 rounded-xl">
                    <FolderOpen size={20} className="text-accent-purple" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(folder)} className="btn-ghost p-1.5 rounded-lg"><Pencil size={13} /></button>
                    {isAdmin && <button onClick={() => setDeleteId(folder.id)} className="btn-ghost p-1.5 rounded-lg hover:text-accent-red"><Trash2 size={13} /></button>}
                  </div>
                </div>

                <h3 className="text-text-primary font-semibold text-sm mb-1 truncate">{folder.name}</h3>
                {folder.description && <p className="text-text-muted text-xs mb-2 line-clamp-2">{folder.description}</p>}

                {c && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-bg-border">
                    {c.avatar ? (
                      <img src={c.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-accent-purple/20 flex items-center justify-center text-[9px] font-bold text-accent-purple">
                        {getInitials(c.name)}
                      </div>
                    )}
                    <span className="text-text-secondary text-xs truncate">{c.name}</span>
                    <span className={`ml-auto badge text-[10px] ${c.status === 'ativo' ? 'bg-green-500/15 text-green-400' : 'bg-bg-hover text-text-muted'}`}>{c.status}</span>
                  </div>
                )}

                <p className="text-text-muted text-xs mt-2">{formatDateTime(folder.created_at)}</p>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar pasta' : 'Nova pasta'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar pasta'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Cliente *</label>
            <select className="select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nome da pasta *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Identidade Visual, Redes Sociais..." />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="O que tem nessa pasta..." />
          </div>
        </div>
      </Modal>

      <Confirm open={!!deleteId} title="Excluir pasta?" message="Essa ação não pode ser desfeita." onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
