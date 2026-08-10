import { COLOR_ESTADO, COLOR_PRIORIDAD } from '../../constants.js'

// Convierte un hex a un fondo suave con transparencia.
function suave(hex) {
  return hex + '1A' // ~10% alpha
}

export function EstadoBadge({ estado }) {
  const color = COLOR_ESTADO[estado] || '#64748B'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: suave(color) }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {estado}
    </span>
  )
}

export function PrioridadBadge({ prioridad }) {
  const color = COLOR_PRIORIDAD[prioridad] || '#64748B'
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: suave(color) }}
    >
      {prioridad}
    </span>
  )
}

export function VencidaBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-vencida/10 px-2.5 py-0.5 text-xs font-semibold text-vencida">
      Vencida
    </span>
  )
}
