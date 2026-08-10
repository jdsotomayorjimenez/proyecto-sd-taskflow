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
