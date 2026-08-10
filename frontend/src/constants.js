// ============================================================================
//  Constantes del dominio - deben coincidir EXACTAMENTE con el backend de Juan
//  (Plan Maestro secciones 12, 13, 14 / Guia Karel secciones 12-14)
// ============================================================================

export const ESTADOS = ['Pendiente', 'En progreso', 'Completada']

export const PRIORIDADES = ['Baja', 'Media', 'Alta']

export const RECURRENCIAS = ['ninguna', 'diaria', 'semanal', 'mensual']

// Colores por estado (paleta ROJO/CALIDA)
export const COLOR_ESTADO = {
  Pendiente: '#E08A00',
  'En progreso': '#D9662B',
  Completada: '#6E9153',
}

// Colores por prioridad (los "puntos de color" tipo Things)
export const COLOR_PRIORIDAD = {
  Baja: '#B0A595',
  Media: '#E08A00',
  Alta: '#C0392B',
}

// 0=Domingo ... 6=Sabado (compatible con JavaScript y FullCalendar)
export const DIAS_SEMANA = [
  { valor: 1, etiqueta: 'Lun' },
  { valor: 2, etiqueta: 'Mar' },
  { valor: 3, etiqueta: 'Mie' },
  { valor: 4, etiqueta: 'Jue' },
  { valor: 5, etiqueta: 'Vie' },
  { valor: 6, etiqueta: 'Sab' },
  { valor: 0, etiqueta: 'Dom' },
]
