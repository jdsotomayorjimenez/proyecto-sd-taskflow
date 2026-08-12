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

  /** GET /api/health -> { status, service }  (liveness: solo comprueba que Node/Express vive) */
  health() {
    return api.get('/api/health')
  },

  /** GET /api/ready -> { status, database }  (readiness: 200 solo si Mongoose esta conectado; 503 si no) */
  ready() {
    return api.get('/api/ready')
  },
}
