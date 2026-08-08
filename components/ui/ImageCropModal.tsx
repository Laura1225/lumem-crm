'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ImageCropModalProps {
  open: boolean
  imageUrl: string
  onApply: (dataUrl: string) => void
  onClose: () => void
}

export default function ImageCropModal({ open, imageUrl, onApply, onClose }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement | null>(null)

  const CANVAS_W = 800
  const CANVAS_H = 320

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = '#18181f'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    const scale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight) * zoom
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    const x = (CANVAS_W - w) / 2 + offset.x
    const y = (CANVAS_H - h) / 2 + offset.y
    ctx.drawImage(img, x, y, w, h)
  }, [zoom, offset])

  useEffect(() => {
    if (!open || !imageUrl) return
    const img = new Image()
    img.onload = () => { imgRef.current = img; setZoom(1); setOffset({ x: 0, y: 0 }); draw() }
    img.src = imageUrl
  }, [open, imageUrl])

  useEffect(() => { draw() }, [draw])

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  function handleMouseUp() { setDragging(false) }

  function handleApply() {
    const canvas = canvasRef.current
    if (!canvas) return
    onApply(canvas.toDataURL('image/jpeg', 0.9))
    onClose()
  }

  function handleReset() { setZoom(1); setOffset({ x: 0, y: 0 }) }

  if (!open) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 9998 }}>
      <div className="modal-box max-w-3xl fade-in">
        <div className="modal-header">
          <h2 className="text-text-primary font-semibold text-base">Ajustar imagem de capa</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-lg cursor-grab active:cursor-grabbing border border-bg-border"
            style={{ maxHeight: 280, objectFit: 'contain' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          <div className="flex items-center gap-4">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="btn-secondary p-2">
              <ZoomOut size={16} />
            </button>
            <input
              type="range" min={50} max={300} value={Math.round(zoom * 100)}
              onChange={e => setZoom(Number(e.target.value) / 100)}
              className="flex-1 accent-purple-500"
            />
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="btn-secondary p-2">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleReset} className="btn-secondary p-2">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleApply} className="btn-primary">Aplicar capa</button>
        </div>
      </div>
    </div>
  )
}
