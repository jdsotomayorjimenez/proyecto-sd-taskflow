// ============================================================================
//  Servicio de autenticacion - envuelve los endpoints /api/auth/*
// ============================================================================
import { api } from './api.js'

export const authService = {
  /** POST /api/auth/register -> { token, usuario } */
  registrar({ nombre, email, password }) {
    return api.post('/api/auth/register', { nombre, email, password })
  },

  /** POST /api/auth/login -> { token, usuario } */
  login({ email, password }) {
    return api.post('/api/auth/login', { email, password })
  },

  /** GET /api/health -> { status, service } */
  health() {
    return api.get('/api/health')
  },
}
