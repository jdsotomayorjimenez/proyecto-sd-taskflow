// ============================================================================
//  Backend simulado (mock) - implementa EXACTAMENTE los endpoints del
//  contrato de Juan (Plan Maestro seccion 11):
//
//    GET    /api/health
//    POST   /api/auth/register
//    POST   /api/auth/login
//    GET    /api/tareas
//    GET    /api/tareas/:id
//    POST   /api/tareas
//    PUT    /api/tareas/:id
//    DELETE /api/tareas/:id
//    PATCH  /api/tareas/:id/completar
//
//  Devuelve siempre { status, data } imitando respuestas HTTP.
// ============================================================================
import {
  usuariosRepo,
  tareasRepo,
  seedIfNeeded,
  genId,
} from './mockDb.js'
import { generarSiguienteOcurrencia } from '../../utils/recurrence.js'

const LATENCIA_MS = 220

const TOKEN_PREFIX = 'mock.'

function ok(data, status = 200) {
  return { status, data }
}
function fail(error, status = 400) {
  return { status, data: { error } }
}

function usuarioDesdeToken(token) {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null
  const id = token.slice(TOKEN_PREFIX.length)
  return usuariosRepo.all().find((u) => u._id === id) || null
}

function usuarioPublico(u) {
  return { id: u._id, nombre: u.nombre, email: u.email }
}

// Normaliza el cuerpo de una tarea que llega del formulario.
function normalizarTarea(body) {
  return {
    titulo: (body.titulo || '').trim(),
    descripcion: body.descripcion || '',
    estado: body.estado || 'Pendiente',
    prioridad: body.prioridad || 'Media',
    fecha: body.fecha || null,
    horaInicio: body.horaInicio || '',
    horaFin: body.horaFin || '',
    repeticion: body.repeticion || {
      tipo: 'ninguna',
      intervalo: 1,
      diasSemana: [],
      fechaFin: null,
    },
  }
}

function handleSync(method, path, body, token) {
  seedIfNeeded()
  const clean = path.split('?')[0]

  // ---------------------------------------------------------------- health
  if (method === 'GET' && clean === '/api/health') {
    return ok({ status: 'ok', service: 'taskflow-backend (mock)' })
  }

  // ------------------------------------------------------------------ auth
  if (method === 'POST' && clean === '/api/auth/register') {
    const nombre = (body.nombre || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    if (!nombre || !email || !password) {
      return fail('Nombre, email y contrasena son obligatorios')
    }
    const usuarios = usuariosRepo.all()
    if (usuarios.some((u) => u.email === email)) {
      return fail('El email ya esta registrado', 409)
    }
    const nuevo = {
      _id: genId(),
      nombre,
      email,
      password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    usuarios.push(nuevo)
    usuariosRepo.save(usuarios)
    return ok(
      { token: TOKEN_PREFIX + nuevo._id, usuario: usuarioPublico(nuevo) },
      201,
    )
  }

  if (method === 'POST' && clean === '/api/auth/login') {
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const usuario = usuariosRepo.all().find((u) => u.email === email)
    if (!usuario || usuario.password !== password) {
      return fail('Credenciales invalidas', 401)
    }
    return ok({
      token: TOKEN_PREFIX + usuario._id,
      usuario: usuarioPublico(usuario),
    })
  }

  // ------------------------------------------------- tareas (protegidas)
  if (clean === '/api/tareas' || clean.startsWith('/api/tareas/')) {
    const usuario = usuarioDesdeToken(token)
    if (!usuario) return fail('No autorizado', 401)

    const todas = tareasRepo.all()
    const mias = () => todas.filter((t) => t.usuarioId === usuario._id)

    // GET /api/tareas -> { tareas: [...] } (mismo envoltorio que el backend real)
    if (method === 'GET' && clean === '/api/tareas') {
      return ok({ tareas: mias() })
    }

    // POST /api/tareas
    if (method === 'POST' && clean === '/api/tareas') {
      const datos = normalizarTarea(body)
      if (!datos.titulo) return fail('El titulo es obligatorio')
      const nueva = {
        _id: genId(),
        usuarioId: usuario._id,
        ...datos,
        serieId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      todas.push(nueva)
      tareasRepo.save(todas)
      return ok(nueva, 201)
    }

    // Rutas con :id
    const resto = clean.slice('/api/tareas/'.length)
    const [id, sub] = resto.split('/')
    const idx = todas.findIndex(
      (t) => t._id === id && t.usuarioId === usuario._id,
    )
    if (idx === -1) return fail('Tarea no encontrada', 404)

    // GET /api/tareas/:id
    if (method === 'GET' && !sub) {
      return ok(todas[idx])
    }

    // PUT /api/tareas/:id
    if (method === 'PUT' && !sub) {
      const datos = normalizarTarea({ ...todas[idx], ...body })
      if (!datos.titulo) return fail('El titulo es obligatorio')
      todas[idx] = {
        ...todas[idx],
        ...datos,
        updatedAt: new Date().toISOString(),
      }
      tareasRepo.save(todas)
      return ok(todas[idx])
    }

    // DELETE /api/tareas/:id
    if (method === 'DELETE' && !sub) {
      const eliminada = todas[idx]
      todas.splice(idx, 1)
      tareasRepo.save(todas)
      return ok(eliminada)
    }

    // PATCH /api/tareas/:id/completar
    if (method === 'PATCH' && sub === 'completar') {
      todas[idx] = {
        ...todas[idx],
        estado: 'Completada',
        updatedAt: new Date().toISOString(),
      }
      // Recurrencia: si corresponde, crear solo la siguiente ocurrencia.
      const siguiente = generarSiguienteOcurrencia(todas[idx])
      if (siguiente) {
        todas.push({
          _id: genId(),
          usuarioId: usuario._id,
          ...siguiente,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      tareasRepo.save(todas)
      return ok(todas[idx])
    }
  }

  return fail('Endpoint no encontrado (mock): ' + method + ' ' + clean, 404)
}

/** Punto de entrada asincrono con latencia simulada. */
export function handle(method, path, body, token) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(handleSync(method, path, body, token)), LATENCIA_MS)
  })
}
