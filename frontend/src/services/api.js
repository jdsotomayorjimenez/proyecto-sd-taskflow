// ============================================================================
//  Cliente HTTP centralizado (Plan Maestro seccion 17 / Guia Karel seccion 17)
//
//  - Un unico lugar lee la URL base: window.APP_CONFIG.API_URL (runtime config).
//  - Adjunta Authorization: Bearer <token> en cada peticion.
//  - Un switch (VITE_USE_MOCK) decide entre backend simulado y fetch real,
//    SIN que los componentes tengan que enterarse.
//  - Ante un 401 limpia la sesion y avisa a la app para redirigir a /login.
// ============================================================================
import { handle as mockHandle } from './mock/mockApi.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const TOKEN_KEY = 'taskflow_token'

/** URL base leida en TIEMPO DE EJECUCION (nunca hardcodeada en el bundle). */
export function getApiUrl() {
  const url = window.APP_CONFIG?.API_URL
  return url ? url.replace(/\/$/, '') : ''
}

export function estaEnModoMock() {
  return USE_MOCK
}

// --------------------------------------------------------------- token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Error de API con el status HTTP para poder distinguir 401, 404, etc. */
export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
  }
}

// Evento global para que AuthContext cierre sesion ante un 401.
function emitirNoAutorizado() {
  window.dispatchEvent(new CustomEvent('taskflow:no-autorizado'))
}

/**
 * Peticion generica.
 * @param {string} method  GET | POST | PUT | PATCH | DELETE
 * @param {string} path    ej. '/api/tareas'
 * @param {object} [body]  cuerpo JSON opcional
 */
export async function request(method, path, body) {
  const token = getToken()

  let status
  let data

  if (USE_MOCK) {
    const res = await mockHandle(method, path, body, token)
    status = res.status
    data = res.data
  } else {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    let res
    try {
      res = await fetch(getApiUrl() + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new ApiError(
        'No se pudo conectar con el backend. Revisa Tailscale / API_URL.',
        0,
      )
    }

    status = res.status
    const texto = await res.text()
    try {
      data = texto ? JSON.parse(texto) : null
    } catch {
      data = texto
    }
  }

  if (status === 401) {
    clearToken()
    emitirNoAutorizado()
  }

  if (status >= 400) {
    const mensaje =
      (data && data.error) || `Error ${status} en la peticion`
    throw new ApiError(mensaje, status)
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
}
