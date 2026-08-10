import { ArrowRight, Clock } from 'lucide-react'
import Select from './Select.jsx'

const pad = (n) => String(n).padStart(2, '0')

// Opciones cada 15 min; incluye el valor actual si no cae en la rejilla.
function opciones(actual) {
  const base = [{ value: '', label: '—' }]
  for (let i = 0; i < 96; i++) {
    const v = `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`
    base.push({ value: v, label: v })
  }
  if (actual && !base.some((o) => o.value === actual)) {
    base.push({ value: actual, label: actual })
  }
  return base
}

function sumarMinutos(hhmm, mins) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = (((h * 60 + m + mins) % 1440) + 1440) % 1440
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

function duracionTexto(inicio, fin) {
  if (!inicio || !fin) return null
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  let diff = hf * 60 + mf - (hi * 60 + mi)
  if (diff <= 0) diff += 1440
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h ? `${h} h ` : ''}${m ? `${m} min` : ''}`.trim() || '0 min'
}

const PRESETS = [
  { label: '15 min', min: 15 },
  { label: '30 min', min: 30 },
  { label: '1 h', min: 60 },
  { label: '2 h', min: 120 },
]

/**
 * Rango horario: inicio -> fin conectados, con chips de duracion rapida.
 * @param {string} inicio 'HH:MM' | ''
 * @param {string} fin    'HH:MM' | ''
 */
export default function TimeRange({ inicio, fin, onInicio, onFin }) {
  const dur = duracionTexto(inicio, fin)

  return (
    <div className="rounded-2xl border border-line p-3">
      <div className="flex items-center gap-2">
        <Select
          value={inicio}
          onChange={onInicio}
          options={opciones(inicio)}
          placeholder="Inicio"
          className="flex-1"
        />
        <ArrowRight size={16} className="shrink-0 text-muted" />
        <Select
          value={fin}
          onChange={onFin}
          options={opciones(fin)}
          placeholder="Fin"
          className="flex-1"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.min}
            type="button"
            disabled={!inicio}
            onClick={() => onFin(sumarMinutos(inicio, p.min))}
            className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            {p.label}
          </button>
        ))}

        {dur && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand">
            <Clock size={12} />
            {dur}
          </span>
        )}
      </div>
    </div>
  )
}
