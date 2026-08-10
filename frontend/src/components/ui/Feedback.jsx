import { Loader2, Inbox, AlertCircle } from 'lucide-react'

export function Spinner({ label = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted">
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ titulo = 'Nada por aqui', descripcion, accion }) {
  return (
    <div className="card-cloud flex flex-col items-center justify-center px-6 py-12 text-center">
      <Inbox className="mb-3 text-muted" size={32} />
      <p className="font-semibold text-ink">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-muted">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}

export function Alerta({ children }) {
  if (!children) return null
  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-vencida/30 bg-vencida/10 px-3 py-2 text-sm text-vencida">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
