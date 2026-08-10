import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const pad = (n) => String(n).padStart(2, '0')
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Campo de fecha custom (español, dd/mm/aaaa). value: 'YYYY-MM-DD' | ''. */
export default function DateField({ value, onChange, id }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const sel = useMemo(() => {
    if (!value) return null
    const [y, m, d] = value.split('-').map(Number)
    return { y, m: m - 1, d }
  }, [value])

  const [vista, setVista] = useState(() => {
    const base = sel || (() => {
      const t = new Date()
      return { y: t.getFullYear(), m: t.getMonth() }
    })()
    return { y: base.y, m: base.m }
  })

  useEffect(() => {
    if (open && sel) setVista({ y: sel.y, m: sel.m })
  }, [open, sel])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const display = sel ? `${pad(sel.d)}/${pad(sel.m + 1)}/${sel.y}` : ''

  // Celdas del mes (lunes primero)
  const celdas = useMemo(() => {
    const primero = new Date(vista.y, vista.m, 1)
    const offset = (primero.getDay() + 6) % 7 // 0 = lunes
    const dias = new Date(vista.y, vista.m + 1, 0).getDate()
    const out = []
    for (let i = 0; i < offset; i++) out.push(null)
    for (let d = 1; d <= dias; d++) out.push(d)
    return out
  }, [vista])

  const hoy = new Date()
  const esHoy = (d) =>
    d === hoy.getDate() && vista.m === hoy.getMonth() && vista.y === hoy.getFullYear()
  const esSel = (d) => sel && d === sel.d && vista.m === sel.m && vista.y === sel.y

  function irMes(delta) {
    setVista((v) => {
      const nm = v.m + delta
      const y = v.y + Math.floor(nm / 12)
      const m = ((nm % 12) + 12) % 12
      return { y, m }
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="input-glass flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        <span className={display ? 'text-ink' : 'text-muted'}>
          {display || 'dd/mm/aaaa'}
        </span>
        <span className="flex items-center gap-1.5">
          {display && (
            <X
              size={15}
              className="text-muted hover:text-ink"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
            />
          )}
          <Calendar size={16} className="shrink-0 text-muted" />
        </span>
      </button>

      {open && (
        <div className="card-cloud absolute z-50 mt-1.5 w-64 p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => irMes(-1)}
              className="rounded-lg p-1 text-muted transition-colors hover:bg-line/50 hover:text-ink"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold capitalize text-ink">
              {MESES[vista.m]} {vista.y}
            </span>
            <button
              type="button"
              onClick={() => irMes(1)}
              className="rounded-lg p-1 text-muted transition-colors hover:bg-line/50 hover:text-ink"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {DIAS.map((d) => (
              <span key={d} className="py-1 text-center text-[11px] font-medium text-muted">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {celdas.map((d, i) =>
              d === null ? (
                <span key={`e${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    onChange(toISO(vista.y, vista.m, d))
                    setOpen(false)
                  }}
                  className={[
                    'flex h-8 items-center justify-center rounded-lg text-sm transition-colors',
                    esSel(d)
                      ? 'bg-brand font-semibold text-white'
                      : esHoy(d)
                        ? 'font-semibold text-brand hover:bg-brand-soft'
                        : 'text-ink hover:bg-line/50',
                  ].join(' ')}
                >
                  {d}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}
