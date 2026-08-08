'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Demand, Client } from '@/lib/types'
import { Calendar, Flag } from 'lucide-react'
import { formatDate, getInitials, priorityColors } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DemandWithClient extends Demand {
  clients?: Pick<Client, 'id' | 'name' | 'avatar'> | null
}

interface Props {
  demand: DemandWithClient
  onClick?: () => void
  overlay?: boolean
}

export default function DemandCard({ demand, onClick, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: demand.id })

  const style = overlay ? {} : {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      onClick={overlay ? undefined : onClick}
      className={cn(
        'bg-bg-card border border-bg-border rounded-lg overflow-hidden cursor-pointer select-none transition-all',
        'hover:border-bg-hover hover:shadow-card',
        isDragging && 'opacity-40',
        overlay && 'shadow-modal rotate-1 scale-105'
      )}
    >
      {/* Cover image */}
      {demand.cover_image && (
        <div className="h-28 overflow-hidden">
          <img src={demand.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-3">
        {/* Tags */}
        {demand.tags && demand.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {demand.tags.slice(0, 3).map(tag => (
              <span key={tag} className="badge bg-accent-purple/10 text-accent-purple text-[10px]">{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-text-primary text-sm font-medium mb-2 leading-snug">{demand.title}</p>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <Flag size={11} style={{ color: priorityColors[demand.priority] }} />

          {demand.due_date && (
            <div className="flex items-center gap-1 text-text-muted text-xs">
              <Calendar size={10} />
              {formatDate(demand.due_date)}
            </div>
          )}

          {demand.clients && (
            <div className="ml-auto flex items-center gap-1">
              {demand.clients.avatar ? (
                <img src={demand.clients.avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-accent-purple/20 flex items-center justify-center text-[8px] font-bold text-accent-purple">
                  {getInitials(demand.clients.name)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
