// ============================================================================
//  Utilidades de fechas - logica pura, sin dependencias de React
// ============================================================================

/** Devuelve YYYY-MM-DD en hora local a partir de un Date o string ISO. */
export function toISODate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** True si la fecha corresponde al dia de hoy (hora local). */
export function esHoy(value) {
  if (!value) return false
  return toISODate(value) === toISODate(new Date())
}

/** True si la fecha cae dentro de la semana actual (Lunes a Domingo). */
export function esEstaSemana(value) {
  if (!value) return false
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  const { inicio, fin } = rangoSemanaActual()
  return d >= inicio && d <= fin
}

/** Rango [Lunes 00:00, Domingo 23:59:59] de la semana que contiene hoy. */
export function rangoSemanaActual(base = new Date()) {
  const d = new Date(base)
  const dia = d.getDay() // 0=Dom..6=Sab
  const diffLunes = dia === 0 ? -6 : 1 - dia
  const inicio = new Date(d)
  inicio.setDate(d.getDate() + diffLunes)
  inicio.setHours(0, 0, 0, 0)
  const fin = new Date(inicio)
  fin.setDate(inicio.getDate() + 6)
  fin.setHours(23, 59, 59, 999)
  return { inicio, fin }
}

/**
 * Una tarea esta VENCIDA si tiene fecha en el pasado (antes de hoy)
 * y su estado NO es "Completada".
 */
export function esVencida(tarea) {
  if (!tarea || !tarea.fecha || tarea.estado === 'Completada') return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(tarea.fecha)
  if (Number.isNaN(f.getTime())) return false
  f.setHours(0, 0, 0, 0)
  return f < hoy
}

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

/** Formato corto legible: "10 ago". Devuelve '' si no hay fecha. */
export function formatoCorto(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

/** Etiqueta relativa amigable: "Hoy", "Manana" o formato corto. */
export function etiquetaFecha(value) {
  if (!value) return 'Sin fecha'
  if (esHoy(value)) return 'Hoy'
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  if (toISODate(value) === toISODate(manana)) return 'Manana'
  return formatoCorto(value)
}
