import { describe, it, expect } from 'vitest'
import {
  proximaFecha,
  generarSiguienteOcurrencia,
  ocurreEnDia,
  ocurrenciasEnRango,
} from './recurrence.js'
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

describe('ocurreEnDia', () => {
  const dia = (a, m, d) => new Date(a, m - 1, d)

  it('sin recurrencia solo el dia exacto de inicio', () => {
    // inicio: martes 4 ago 2026
    const t = baseTarea({ fecha: dia(2026, 8, 4).toISOString() })
    expect(ocurreEnDia(t, dia(2026, 8, 4))).toBe(true)
    expect(ocurreEnDia(t, dia(2026, 8, 5))).toBe(false)
  })

  it('nunca se muestra antes de la fecha de inicio', () => {
    const t = baseTarea({
      fecha: dia(2026, 8, 4).toISOString(),
      repeticion: { tipo: 'diaria', intervalo: 1 },
    })
    expect(ocurreEnDia(t, dia(2026, 8, 3))).toBe(false)
    expect(ocurreEnDia(t, dia(2026, 8, 4))).toBe(true)
  })

  it('diaria sin fecha fin se muestra todos los dias (lavarse los dientes)', () => {
    const t = baseTarea({
      fecha: dia(2026, 8, 4).toISOString(),
      repeticion: { tipo: 'diaria', intervalo: 1, diasSemana: [], fechaFin: null },
    })
    expect(ocurreEnDia(t, dia(2026, 8, 4))).toBe(true)
    expect(ocurreEnDia(t, dia(2026, 8, 5))).toBe(true)
    expect(ocurreEnDia(t, dia(2026, 12, 31))).toBe(true)
  })

  it('semanal Mar+Mie aparece en cada martes y miercoles', () => {
    // inicio: martes 4 ago 2026; marcados martes(2) y miercoles(3)
    const t = baseTarea({
      fecha: dia(2026, 8, 4).toISOString(),
      repeticion: { tipo: 'semanal', intervalo: 1, diasSemana: [2, 3], fechaFin: null },
    })
    expect(ocurreEnDia(t, dia(2026, 8, 4))).toBe(true) // martes
    expect(ocurreEnDia(t, dia(2026, 8, 5))).toBe(true) // miercoles
    expect(ocurreEnDia(t, dia(2026, 8, 6))).toBe(false) // jueves
    expect(ocurreEnDia(t, dia(2026, 8, 11))).toBe(true) // martes siguiente
    expect(ocurreEnDia(t, dia(2026, 8, 12))).toBe(true) // miercoles siguiente
  })

  it('fechaFin es solo un tope: sabado 15 no cambia nada si solo cae Mar/Mie', () => {
    const t = baseTarea({
      fecha: dia(2026, 8, 4).toISOString(),
      repeticion: {
        tipo: 'semanal',
        intervalo: 1,
        diasSemana: [2, 3],
        fechaFin: dia(2026, 8, 15).toISOString(),
      },
    })
    expect(ocurreEnDia(t, dia(2026, 8, 12))).toBe(true) // miercoles (ultimo real)
    expect(ocurreEnDia(t, dia(2026, 8, 18))).toBe(false) // martes: ya paso el tope
  })

  it('semanal con intervalo 2 salta una semana', () => {
    const t = baseTarea({
      fecha: dia(2026, 8, 4).toISOString(),
      repeticion: { tipo: 'semanal', intervalo: 2, diasSemana: [2, 3], fechaFin: null },
    })
    expect(ocurreEnDia(t, dia(2026, 8, 4))).toBe(true) // semana 0
    expect(ocurreEnDia(t, dia(2026, 8, 11))).toBe(false) // semana 1 (saltada)
    expect(ocurreEnDia(t, dia(2026, 8, 18))).toBe(true) // semana 2
  })

  it('mensual se muestra el mismo dia del mes', () => {
    const t = baseTarea({
      fecha: dia(2026, 8, 10).toISOString(),
      repeticion: { tipo: 'mensual', intervalo: 1, diasSemana: [], fechaFin: null },
    })
    expect(ocurreEnDia(t, dia(2026, 9, 10))).toBe(true)
    expect(ocurreEnDia(t, dia(2026, 9, 11))).toBe(false)
  })
})

describe('ocurrenciasEnRango', () => {
  const dia = (a, m, d) => new Date(a, m - 1, d)

  it('expande una semanal Mar+Mie dentro del rango visible', () => {
    const t = baseTarea({
      fecha: dia(2026, 8, 4).toISOString(),
      repeticion: { tipo: 'semanal', intervalo: 1, diasSemana: [2, 3], fechaFin: null },
    })
    // Rango: lunes 3 ago -> lunes 17 ago (exclusivo)
    const fechas = ocurrenciasEnRango(t, dia(2026, 8, 3), dia(2026, 8, 17)).map(toISODate)
    expect(fechas).toEqual(['2026-08-04', '2026-08-05', '2026-08-11', '2026-08-12'])
  })

  it('rango vacio cuando la tarea empieza despues del rango', () => {
    const t = baseTarea({
      fecha: dia(2026, 9, 1).toISOString(),
      repeticion: { tipo: 'diaria', intervalo: 1 },
    })
    expect(ocurrenciasEnRango(t, dia(2026, 8, 1), dia(2026, 8, 31))).toEqual([])
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
