import { describe, it, expect } from 'vitest'
import { proximaFecha, generarSiguienteOcurrencia } from './recurrence.js'
import { toISODate } from './dates.js'

const baseTarea = (over) => ({
  _id: 't1',
  titulo: 'Repetir',
  fecha: new Date(2026, 7, 10, 9, 0, 0).toISOString(), // lunes 10 ago 2026
  estado: 'Completada',
  prioridad: 'Media',
  repeticion: { tipo: 'ninguna', intervalo: 1, diasSemana: [], fechaFin: null },
  ...over,
})

describe('proximaFecha', () => {
  it('devuelve null sin recurrencia', () => {
    expect(proximaFecha(baseTarea())).toBeNull()
  })

  it('diaria suma el intervalo en dias', () => {
    const t = baseTarea({ repeticion: { tipo: 'diaria', intervalo: 2 } })
    expect(toISODate(proximaFecha(t))).toBe('2026-08-12')
  })

  it('mensual suma el intervalo en meses', () => {
    const t = baseTarea({ repeticion: { tipo: 'mensual', intervalo: 1 } })
    expect(toISODate(proximaFecha(t))).toBe('2026-09-10')
  })

  it('semanal sin dias salta 7 dias', () => {
    const t = baseTarea({ repeticion: { tipo: 'semanal', intervalo: 1, diasSemana: [] } })
    expect(toISODate(proximaFecha(t))).toBe('2026-08-17')
  })

  it('semanal con dias elige el proximo dia marcado', () => {
    // lunes 10; marcado miercoles(3) y viernes(5) -> proximo = miercoles 12
    const t = baseTarea({ repeticion: { tipo: 'semanal', intervalo: 1, diasSemana: [3, 5] } })
    expect(toISODate(proximaFecha(t))).toBe('2026-08-12')
  })

  it('respeta fechaFin', () => {
    const t = baseTarea({
      repeticion: {
        tipo: 'diaria',
        intervalo: 1,
        fechaFin: new Date(2026, 7, 10).toISOString(),
      },
    })
    expect(proximaFecha(t)).toBeNull()
  })
})

describe('generarSiguienteOcurrencia', () => {
  it('crea una nueva ocurrencia Pendiente con el mismo serieId', () => {
    const t = baseTarea({ repeticion: { tipo: 'diaria', intervalo: 1 } })
    const sig = generarSiguienteOcurrencia(t)
    expect(sig.estado).toBe('Pendiente')
    expect(sig.serieId).toBe('t1')
    expect(toISODate(sig.fecha)).toBe('2026-08-11')
  })

  it('devuelve null cuando no hay recurrencia', () => {
    expect(generarSiguienteOcurrencia(baseTarea())).toBeNull()
  })
})
