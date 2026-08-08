'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function Confirm({ open, title, message, confirmLabel = 'Confirmar', danger = true, onConfirm, onCancel }: ConfirmProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-box max-w-sm fade-in">
        <div className="modal-body text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${danger ? 'bg-red-500/10' : 'bg-accent-purple/10'}`}>
            <AlertTriangle size={22} className={danger ? 'text-accent-red' : 'text-accent-purple'} />
          </div>
          <h3 className="text-text-primary font-semibold text-base mb-1">{title}</h3>
          <p className="text-text-secondary text-sm">{message}</p>
        </div>
        <div className="modal-footer justify-center gap-3">
          <button onClick={onCancel} className="btn-secondary px-5">Cancelar</button>
          <button
            onClick={() => { onConfirm(); }}
            className={danger ? 'btn-danger px-5' : 'btn-primary px-5'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
