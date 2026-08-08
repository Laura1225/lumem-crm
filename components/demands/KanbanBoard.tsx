'use client'

import { useState, useCallback } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { Demand, DemandColumn, Client } from '@/lib/types'
import KanbanColumn from './KanbanColumn'
import DemandCard from './DemandCard'
import DemandPanel from './DemandPanel'
import { Plus, Settings2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Confirm from '@/components/ui/Confirm'
import PageHeader from '@/components/ui/PageHeader'

interface DemandWithClient extends Demand {
  clients?: Pick<Client, 'id' | 'name' | 'avatar'> | null
}

interface Props {
  initialColumns: DemandColumn[]
  initialDemands: DemandWithClient[]
  clients: Pick<Client, 'id' | 'name' | 'avatar'>[]
  workspaceId: string
  isAdmin: boolean
}

export default function KanbanBoard({ initialColumns, initialDemands, clients, workspaceId, isAdmin }: Props) {
  const [columns, setColumns] = useState<DemandColumn[]>(initialColumns)
  const [demands, setDemands] = useState<DemandWithClient[]>(initialDemands)
  const [activeDemand, setActiveDemand] = useState<DemandWithClient | null>(null)
  const [panelDemand, setPanelDemand] = useState<DemandWithClient | null>(null)
  const [colModalOpen, setColModalOpen] = useState(false)
  const [colForm, setColForm] = useState({ title: '', color: '#a855f7' })
  const [deleteColId, setDeleteColId] = useState<string | null>(null)
  const [quickAdd, setQuickAdd] = useState<{ columnId: string; value: string } | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const demandsInCol = useCallback((colId: string) =>
    demands.filter(d => d.column_id === colId).sort((a, b) => a.position - b.position),
  [demands])

  function handleDragStart(e: DragStartEvent) {
    setActiveDemand(demands.find(d => d.id === e.active.id) || null)
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const activeDem = demands.find(d => d.id === activeId)
    if (!activeDem) return

    const overDem = demands.find(d => d.id === overId)
    const overCol = columns.find(c => c.id === overId)
    const newColId = overDem ? overDem.column_id : overCol ? overCol.id : null
    if (!newColId || newColId === activeDem.column_id) return

    setDemands(ds => ds.map(d => d.id === activeId ? { ...d, column_id: newColId } : d))
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveDemand(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeDem = demands.find(d => d.id === activeId)
    if (!activeDem) return

    const colDemands = demandsInCol(activeDem.column_id)
    const oldIndex = colDemands.findIndex(d => d.id === activeId)
    const newIndex = colDemands.findIndex(d => d.id === overId)

    if (oldIndex !== newIndex && newIndex !== -1) {
      const reordered = arrayMove(colDemands, oldIndex, newIndex)
      const updates = reordered.map((d, i) => ({ ...d, position: i }))
      setDemands(ds => {
        const others = ds.filter(d => d.column_id !== activeDem.column_id)
        return [...others, ...updates]
      })
      for (const d of updates) {
        await supabase.from('demands').update({ column_id: d.column_id, position: d.position }).eq('id', d.id)
      }
    } else {
      await supabase.from('demands').update({ column_id: activeDem.column_id }).eq('id', activeId)
    }
  }

  async function handleAddColumn() {
    if (!colForm.title.trim()) return
    const { data } = await supabase.from('demand_columns').insert({
      workspace_id: workspaceId, title: colForm.title, color: colForm.color, position: columns.length
    }).select().single()
    if (data) setColumns(cs => [...cs, data])
    setColModalOpen(false)
    setColForm({ title: '', color: '#a855f7' })
  }

  async function handleDeleteColumn(id: string) {
    await supabase.from('demand_columns').delete().eq('id', id)
    setColumns(cs => cs.filter(c => c.id !== id))
    setDemands(ds => ds.filter(d => d.column_id !== id))
    setDeleteColId(null)
  }

  async function handleQuickAdd(columnId: string, title: string) {
    if (!title.trim()) return
    const colDemands = demandsInCol(columnId)
    const { data } = await supabase.from('demands').insert({
      workspace_id: workspaceId, column_id: columnId, title: title.trim(),
      priority: 'media', position: colDemands.length, tags: []
    }).select('*, clients(id, name, avatar)').single()
    if (data) setDemands(ds => [...ds, data as DemandWithClient])
    setQuickAdd(null)
    await supabase.from('activities').insert({ workspace_id: workspaceId, icon: '📋', section: 'demandas', action: 'Demanda criada', detail: title })
  }

  async function handleDeleteDemand(id: string) {
    await supabase.from('demands').delete().eq('id', id)
    setDemands(ds => ds.filter(d => d.id !== id))
    if (panelDemand?.id === id) setPanelDemand(null)
  }

  function handlePanelSave(updated: DemandWithClient) {
    setDemands(ds => ds.map(d => d.id === updated.id ? updated : d))
    setPanelDemand(updated)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Demandas"
        description="Kanban de projetos e tarefas"
        action={
          isAdmin && (
            <button onClick={() => setColModalOpen(true)} className="btn-secondary text-sm">
              <Settings2 size={15} /> Gerenciar colunas
            </button>
          )
        }
      />

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 160px)' }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          {columns.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              demands={demandsInCol(col.id)}
              onCardClick={d => setPanelDemand(d)}
              onDelete={isAdmin ? () => setDeleteColId(col.id) : undefined}
              onQuickAdd={(v) => setQuickAdd({ columnId: col.id, value: v })}
              quickAddValue={quickAdd?.columnId === col.id ? quickAdd.value : null}
              onQuickAddChange={(v) => setQuickAdd(q => q ? { ...q, value: v } : null)}
              onQuickAddSubmit={() => quickAdd && handleQuickAdd(quickAdd.columnId, quickAdd.value)}
              onQuickAddCancel={() => setQuickAdd(null)}
            />
          ))}

          <DragOverlay>
            {activeDemand && <DemandCard demand={activeDemand} overlay />}
          </DragOverlay>
        </DndContext>

        {/* Add column button */}
        {isAdmin && (
          <button
            onClick={() => setColModalOpen(true)}
            className="flex-shrink-0 w-72 h-fit border-2 border-dashed border-bg-border rounded-card p-4 text-text-muted hover:text-text-secondary hover:border-accent-purple/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} /> Nova coluna
          </button>
        )}
      </div>

      {/* Demand side panel */}
      {panelDemand && (
        <DemandPanel
          demand={panelDemand}
          columns={columns}
          clients={clients}
          workspaceId={workspaceId}
          onClose={() => setPanelDemand(null)}
          onSave={handlePanelSave}
          onDelete={() => handleDeleteDemand(panelDemand.id)}
        />
      )}

      {/* Add column modal */}
      <Modal open={colModalOpen} onClose={() => setColModalOpen(false)} title="Nova coluna"
        footer={
          <>
            <button onClick={() => setColModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleAddColumn} className="btn-primary">Criar coluna</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Nome da coluna</label>
            <input className="input" value={colForm.title} onChange={e => setColForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Em revisão, Aprovado..." />
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {['#a855f7', '#3b82f6', '#f59e0b', '#22c55e', '#ec4899', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                <button key={color} onClick={() => setColForm(f => ({ ...f, color }))}
                  className={`w-8 h-8 rounded-lg transition-transform ${colForm.color === color ? 'scale-110 ring-2 ring-white/40' : 'hover:scale-105'}`}
                  style={{ background: color }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Confirm open={!!deleteColId} title="Excluir coluna?" message="Todas as demandas nessa coluna também serão removidas." onConfirm={() => deleteColId && handleDeleteColumn(deleteColId)} onCancel={() => setDeleteColId(null)} />
    </div>
  )
}
