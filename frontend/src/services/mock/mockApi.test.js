import { describe, it, expect, beforeEach } from 'vitest'
import { handle } from './mockApi.js'

async function login() {
  const res = await handle('POST', '/api/auth/login', {
    email: 'demo@taskflow.com',
    password: 'demo123',
  })
  return res.data.token
}

describe('mockApi', () => {
  beforeEach(() => localStorage.clear())

  it('GET /api/health responde ok', async () => {
    const res = await handle('GET', '/api/health')
    expect(res.status).toBe(200)
    expect(res.data.status).toBe('ok')
  })

  it('GET /api/ready responde ready con la BD conectada', async () => {
    const res = await handle('GET', '/api/ready')
    expect(res.status).toBe(200)
    expect(res.data.status).toBe('ready')
    expect(res.data.database).toBe('connected')
  })

  it('login demo funciona y credenciales malas fallan', async () => {
    const ok = await handle('POST', '/api/auth/login', {
      email: 'demo@taskflow.com',
      password: 'demo123',
    })
    expect(ok.status).toBe(200)
    expect(ok.data.token).toBeTruthy()

    const bad = await handle('POST', '/api/auth/login', {
      email: 'demo@taskflow.com',
      password: 'mal',
    })
    expect(bad.status).toBe(401)
  })

  it('rechaza tareas sin token', async () => {
    const res = await handle('GET', '/api/tareas', null, null)
    expect(res.status).toBe(401)
  })

  it('registro rechaza email duplicado', async () => {
    await handle('POST', '/api/auth/login', { email: 'x', password: 'y' }) // fuerza seed
    const dup = await handle('POST', '/api/auth/register', {
      nombre: 'Otro',
      email: 'demo@taskflow.com',
      password: '123456',
    })
    expect(dup.status).toBe(409)
  })

  it('CRUD completo de tareas', async () => {
    const token = await login()

    // crear
    const creada = await handle(
      'POST',
      '/api/tareas',
      { titulo: 'Prueba CRUD', estado: 'Pendiente', prioridad: 'Alta' },
      token,
    )
    expect(creada.status).toBe(201)
    const id = creada.data._id

    // listar (contiene la nueva)
    const lista = await handle('GET', '/api/tareas', null, token)
    expect(lista.data.tareas.some((t) => t._id === id)).toBe(true)

    // editar
    const editada = await handle(
      'PUT',
      `/api/tareas/${id}`,
      { titulo: 'Prueba editada', estado: 'En progreso' },
      token,
    )
    expect(editada.data.titulo).toBe('Prueba editada')
    expect(editada.data.estado).toBe('En progreso')

    // eliminar
    const del = await handle('DELETE', `/api/tareas/${id}`, null, token)
    expect(del.status).toBe(200)
    const obtener = await handle('GET', `/api/tareas/${id}`, null, token)
    expect(obtener.status).toBe(404)
  })

  it('completar una tarea recurrente genera la siguiente ocurrencia', async () => {
    const token = await login()
    const creada = await handle(
      'POST',
      '/api/tareas',
      {
        titulo: 'Recurrente',
        fecha: new Date(2026, 7, 10).toISOString(),
        repeticion: { tipo: 'diaria', intervalo: 1, diasSemana: [], fechaFin: null },
      },
      token,
    )
    const id = creada.data._id

    const antes = (await handle('GET', '/api/tareas', null, token)).data.tareas.length
    await handle('PATCH', `/api/tareas/${id}/completar`, null, token)
    const despues = await handle('GET', '/api/tareas', null, token)

    // La original quedo Completada y se creo una nueva Pendiente.
    expect(despues.data.tareas.length).toBe(antes + 1)
    const original = despues.data.tareas.find((t) => t._id === id)
    expect(original.estado).toBe('Completada')
    const nueva = despues.data.tareas.find((t) => t.serieId === id)
    expect(nueva).toBeTruthy()
    expect(nueva.estado).toBe('Pendiente')
  })
})
