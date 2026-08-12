// ============================================================================
//  Logica de recurrencia (espejo del backend - Plan Maestro seccion 10)
//
//  Estrategia: NO se generan cientos de documentos por adelantado.
//  Al completar una tarea recurrente se calcula UNICAMENTE la siguiente
//  ocurrencia, conservando el mismo serieId.
//
//  El backend real de Juan implementara esta misma logica; aqui la usa la
//  capa mock para que el comportamiento visible sea identico.
// ============================================================================

/**
 * Calcula la fecha de la proxima ocurrencia a partir de una tarea.
 * @returns {Date|null} null si no hay recurrencia o si supera fechaFin.
 */
export function proximaFecha(tarea) {
  const rep = tarea?.repeticion
  if (!rep || !rep.tipo || rep.tipo === 'ninguna') return null
  if (!tarea.fecha) return null

  const base = new Date(tarea.fecha)
  if (Number.isNaN(base.getTime())) return null

  const intervalo = Math.max(1, Number(rep.intervalo) || 1)
  let siguiente = null

  switch (rep.tipo) {
    case 'diaria': {
      siguiente = new Date(base)
      siguiente.setDate(base.getDate() + intervalo)
      break
    }
    case 'semanal': {
      siguiente = proximoDiaSemanal(base, rep.diasSemana, intervalo)
      break
    }
    case 'mensual': {
      siguiente = new Date(base)
      siguiente.setMonth(base.getMonth() + intervalo)
      break
    }
    default:
      return null
  }

  if (!siguiente) return null

  if (rep.fechaFin) {
    const fin = new Date(rep.fechaFin)
    if (!Number.isNaN(fin.getTime()) && siguiente > fin) return null
  }

  return siguiente
}

/**
 * Para recurrencia semanal con dias especificos (0=Dom..6=Sab),
 * busca el proximo dia marcado despues de la fecha base.
 * Si no hay dias marcados, salta intervalo*7 dias.
 */
function proximoDiaSemanal(base, diasSemana, intervalo) {
  const dias = Array.isArray(diasSemana) ? diasSemana : []
  if (dias.length === 0) {
    const d = new Date(base)
    d.setDate(base.getDate() + 7 * intervalo)
    return d
  }
  const ordenados = [...dias].sort((a, b) => a - b)
  for (let offset = 1; offset <= 7; offset++) {
    const cand = new Date(base)
    cand.setDate(base.getDate() + offset)
    if (ordenados.includes(cand.getDay())) return cand
  }
  const d = new Date(base)
  d.setDate(base.getDate() + 7)
  return d
}

// ============================================================================
//  Expansion VISUAL de ocurrencias (solo para pintar el calendario).
//
//  No crea documentos ni toca el backend: dado un rango de dias visibles,
//  decide en que dias debe MOSTRARSE una tarea recurrente. Asi una tarea
//  "semanal Mar+Mie" aparece en cada martes y miercoles, y una "diaria sin
//  fecha fin" aparece todos los dias (acotada al rango visible, nunca infinito).
// ============================================================================

/** Copia de la fecha a medianoche local (para comparar solo por dia). */
function aMedianoche(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Numero entero de dias entre a y b (b - a), comparando a medianoche. */
function diasEntre(a, b) {
  const MS_DIA = 86400000
  return Math.round((aMedianoche(b) - aMedianoche(a)) / MS_DIA)
}

/** Lunes (00:00) de la semana que contiene la fecha (semana Lun-Dom). */
function inicioSemana(value) {
  const d = aMedianoche(value)
  const dow = d.getDay() // 0=Dom..6=Sab
  const offset = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + offset)
  return d
}

/**
 * Indica si una tarea debe MOSTRARSE en el dia dado. Puramente visual.
 *
 * Reglas:
 *  - Nunca antes de su fecha de inicio.
 *  - Sin repeticion -> solo el dia exacto de inicio.
 *  - Con fechaFin -> deja de mostrarse despues de esa fecha (tope superior).
 *  - Sin fechaFin -> se repite indefinidamente.
 *
 * @param {object} tarea
 * @param {Date|string} dia
 * @returns {boolean}
 */
export function ocurreEnDia(tarea, dia) {
  if (!tarea?.fecha) return false
  const inicio = aMedianoche(tarea.fecha)
  if (Number.isNaN(inicio.getTime())) return false

  const d = aMedianoche(dia)
  if (Number.isNaN(d.getTime())) return false
  if (d < inicio) return false // nunca antes de empezar

  const rep = tarea.repeticion
  const tipo = rep?.tipo
  if (!rep || !tipo || tipo === 'ninguna') {
    return diasEntre(inicio, d) === 0
  }

  if (rep.fechaFin) {
    const fin = aMedianoche(rep.fechaFin)
    if (!Number.isNaN(fin.getTime()) && d > fin) return false
  }

  const intervalo = Math.max(1, Number(rep.intervalo) || 1)

  switch (tipo) {
    case 'diaria':
      return diasEntre(inicio, d) % intervalo === 0

    case 'semanal': {
      const dias = Array.isArray(rep.diasSemana) ? rep.diasSemana : []
      if (dias.length === 0) {
        // Sin dias marcados: cada 'intervalo' semanas, el mismo dia de la semana.
        return diasEntre(inicio, d) % (7 * intervalo) === 0
      }
      if (!dias.includes(d.getDay())) return false
      // Con dias marcados: alinear por bloques de 'intervalo' semanas.
      const semanas = Math.round(diasEntre(inicioSemana(inicio), inicioSemana(d)) / 7)
      return semanas % intervalo === 0
    }

    case 'mensual': {
      if (d.getDate() !== inicio.getDate()) return false
      const meses =
        (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth())
      return meses % intervalo === 0
    }

    default:
      return diasEntre(inicio, d) === 0
  }
}

/**
 * Expande una tarea en todas sus fechas de ocurrencia dentro de [desde, hasta).
 * 'desde' inclusivo, 'hasta' exclusivo (igual que FullCalendar). Solo recorre la
 * ventana visible, por lo que el coste esta acotado aunque no exista fechaFin.
 *
 * @param {object} tarea
 * @param {Date|string} desde
 * @param {Date|string} hasta
 * @returns {Date[]} fechas (a medianoche local) en las que la tarea se muestra.
 */
export function ocurrenciasEnRango(tarea, desde, hasta) {
  const fechas = []
  if (!tarea?.fecha) return fechas

  const cursor = aMedianoche(desde)
  const limite = aMedianoche(hasta)
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(limite.getTime())) return fechas

  // Tope de seguridad: ninguna vista del calendario supera ~42 dias.
  let guardia = 0
  while (cursor < limite && guardia < 400) {
    if (ocurreEnDia(tarea, cursor)) fechas.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
    guardia++
  }
  return fechas
}

/**
 * Genera la SIGUIENTE ocurrencia (nuevo documento Pendiente) a partir de una
 * tarea recien completada. Devuelve null si no corresponde crear otra.
 */
export function generarSiguienteOcurrencia(tareaCompletada) {
  const fecha = proximaFecha(tareaCompletada)
  if (!fecha) return null

  return {
    titulo: tareaCompletada.titulo,
    descripcion: tareaCompletada.descripcion,
    estado: 'Pendiente',
    prioridad: tareaCompletada.prioridad,
    fecha: fecha.toISOString(),
    horaInicio: tareaCompletada.horaInicio,
    horaFin: tareaCompletada.horaFin,
    repeticion: { ...tareaCompletada.repeticion },
    serieId: tareaCompletada.serieId || tareaCompletada._id,
  }
}
