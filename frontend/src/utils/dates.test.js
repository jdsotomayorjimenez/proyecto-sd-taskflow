import { describe, it, expect } from 'vitest'
import { toISODate, esHoy, esVencida, rangoSemanaActual } from './dates.js'

describe('toISODate', () => {
  it('formatea un Date a YYYY-MM-DD', () => {
    const d = new Date(2026, 7, 10, 15, 0, 0) // 10 ago 2026 local
    expect(toISODate(d)).toBe('2026-08-10')
  })
  it('devuelve cadena vacia para valores invalidos', () => {
    expect(toISODate(null)).toBe('')
    expect(toISODate('no-fecha')).toBe('')
  })
})

describe('esHoy', () => {
  it('reconoce la fecha actual', () => {
    expect(esHoy(new Date())).toBe(true)
  })
  it('rechaza otra fecha', () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    expect(esHoy(ayer)).toBe(false)
  })
})

describe('esVencida', () => {
  it('marca vencida una tarea pasada no completada', () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    expect(esVencida({ fecha: ayer.toISOString(), estado: 'Pendiente' })).toBe(true)
  })
  it('no marca vencida si esta completada', () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    expect(esVencida({ fecha: ayer.toISOString(), estado: 'Completada' })).toBe(false)
  })
  it('no marca vencida una tarea futura', () => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    expect(esVencida({ fecha: manana.toISOString(), estado: 'Pendiente' })).toBe(false)
  })
})

describe('rangoSemanaActual', () => {
  it('empieza en lunes y termina en domingo', () => {
    const { inicio, fin } = rangoSemanaActual(new Date(2026, 7, 12)) // miercoles
    expect(inicio.getDay()).toBe(1) // lunes
    expect(fin.getDay()).toBe(0) // domingo
  })
})
