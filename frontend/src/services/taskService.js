// ============================================================================
//  Servicio de tareas - envuelve el CRUD de /api/tareas
//  (crear, listar, obtener, editar, eliminar, completar)
// ============================================================================
import { api } from './api.js'

export const taskService = {
  /** GET /api/tareas */
  listar() {
    return api.get('/api/tareas')
  },

  /** GET /api/tareas/:id */
  obtener(id) {
    return api.get(`/api/tareas/${id}`)
  },

  /** POST /api/tareas */
  crear(tarea) {
    return api.post('/api/tareas', tarea)
  },

  /** PUT /api/tareas/:id */
  actualizar(id, tarea) {
    return api.put(`/api/tareas/${id}`, tarea)
  },

  /** DELETE /api/tareas/:id */
  eliminar(id) {
    return api.delete(`/api/tareas/${id}`)
  },

  /** PATCH /api/tareas/:id/completar */
  completar(id) {
    return api.patch(`/api/tareas/${id}/completar`)
  },
}
