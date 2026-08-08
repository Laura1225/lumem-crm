'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DemandColumn, Demand, Client } from '@/lib/types'
import DemandCard from './DemandCard'
import { Plus, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface DemandWithClient extends Demand {
  clients?: Pick<Client, 'id' | 'name' | 'avatar'> | null
}

interface Props {
  column: DemandColumn
  demands: DemandWithClient[]
  onCardClick: (d: DemandWithClient) => void
  onDelete?: () => void
  onQuickAdd: (v: string) => void
  quickAddValue: string | null
  onQuickAddChange: (v: string) => void
  onQuickAddSubmit: () => void
  onQuickAddCancel: () => void
}

export default function KanbanColumn({
  column, demands, onCardClick, onDelete,
  onQuickAdd, quickAddValue, onQuickAddChange, onQuickAddSubmit, onQuickAddCancel
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex-shrink-0 w-72 flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: column.color }} />
        <h3 className="text-text-primary font-semibold text-sm flex-1">{column.title}</h3>
        <span className="badge bg-bg-hover text-text-muted text-xs">{demands.length}</span>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-1 rounded-lg"><MoreVertical size={14} /></button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-bg-card border border-bg-border rounded-lg shadow-card z-10 overflow-hidden">
              <button
                onClick={() => { onQuickAdd(''); setMenuOpen(false) }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover w-full text-left"
              >
                <Plus size={13} /> Adicionar demanda
              </button>
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-accent-red hover:bg-red-500/10 w-full text-left"
                >
                  <Trash2 size={13} /> Excluir coluna
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2 rounded-card p-2 transition-colors ${isOver ? 'bg-accent-purple/5 border border-dashed border-accent-purple/30' : 'bg-bg/40'}`}
        onClick={() => menuOpen && setMenuOpen(false)}
      >
        <SortableContext items={demands.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {demands.map(d => (
            <DemandCard key={d.id} demand={d} onClick={() => onCardClick(d)} />
          ))}
        </SortableContext>

        {/* Quick add input */}
        {quickAddValue !== null && (
          <div className="p-2 bg-bg-card border border-accent-purple/40 rounded-lg">
            <input
              autoFocus
              className="input text-sm mb-2"
              value={quickAddValue}
              onChange={e => onQuickAddChange(e.target.value)}
              placeholder="Título da demanda..."
              onKeyDown={e => {
                if (e.key === 'Enter') onQuickAddSubmit()
                if (e.key === 'Escape') onQuickAddCancel()
              }}
            />
            <div className="flex gap-2">
              <button onClick={onQuickAddSubmit} className="btn-primary text-xs px-3 py-1.5">Adicionar</button>
              <button onClick={onQuickAddCancel} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
            </div>
          </div>
        )}

        {/* Add button */}
        {quickAddValue === null && (
          <button
            onClick={() => onQuickAdd('')}
            className="w-full flex items-center gap-2 px-2 py-2 text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded-lg text-xs transition-all"
          >
            <Plus size={13} /> Adicionar
          </button>
        )}
      </div>
    </div>
  )
}
