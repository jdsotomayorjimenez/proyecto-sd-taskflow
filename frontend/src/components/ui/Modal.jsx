import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Modal centrado con fondo oscuro. Se cierra con Escape o click fuera. */
export default function Modal({ abierto, onCerrar, titulo, children, footer }) {
  useEffect(() => {
    if (!abierto) return
    const onKey = (e) => e.key === 'Escape' && onCerrar?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onCerrar}
      />
      <div className="card-cloud relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-muted transition-colors hover:bg-canvas hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
