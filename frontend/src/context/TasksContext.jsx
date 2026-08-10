// ============================================================================
//  TasksContext - estado central de las tareas + gestion de los modales
//  de crear / editar / eliminar (un solo lugar para toda la app).
// ============================================================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { taskService } from '../services/taskService.js'
import TaskFormModal from '../components/tasks/TaskFormModal.jsx'
import ConfirmModal from '../components/ui/ConfirmModal.jsx'

const TasksContext = createContext(null)

export function TasksProvider({ children }) {
  const [tareas, setTareas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Estado de los modales
  const [form, setForm] = useState({ abierto: false, tarea: null, fecha: null })
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const data = await taskService.listar()
      // El backend real responde { tareas: [...] }; el mock hace lo mismo.
      const lista = Array.isArray(data) ? data : data?.tareas ?? []
      setTareas(lista)
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las tareas')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  // --------------------------------------------------------------- CRUD
  const guardar = useCallback(
    async (payload) => {
      if (form.tarea) {
        const act = await taskService.actualizar(form.tarea._id, payload)
        setTareas((prev) => prev.map((t) => (t._id === act._id ? act : t)))
      } else {
        const nueva = await taskService.crear(payload)
        setTareas((prev) => [...prev, nueva])
      }
    },
    [form.tarea],
  )

  const completar = useCallback(
    async (tarea) => {
      await taskService.completar(tarea._id)
      // Puede generar una nueva ocurrencia (recurrencia): recargamos.
      await recargar()
    },
    [recargar],
  )

  const confirmarEliminar = useCallback(async () => {
    if (!aEliminar) return
    setEliminando(true)
    try {
      await taskService.eliminar(aEliminar._id)
      setTareas((prev) => prev.filter((t) => t._id !== aEliminar._id))
      setAEliminar(null)
    } catch (e) {
      setError(e.message || 'No se pudo eliminar')
    } finally {
      setEliminando(false)
    }
  }, [aEliminar])

  // ------------------------------------------------------- API imperativa
  const abrirCrear = useCallback(
    (fecha = null) => setForm({ abierto: true, tarea: null, fecha }),
    [],
  )
  const abrirEditar = useCallback(
    (tarea) => setForm({ abierto: true, tarea, fecha: null }),
    [],
  )
  const cerrarForm = useCallback(
    () => setForm({ abierto: false, tarea: null, fecha: null }),
    [],
  )
  const pedirEliminar = useCallback((tarea) => setAEliminar(tarea), [])

  const value = {
    tareas,
    cargando,
    error,
    recargar,
    abrirCrear,
    abrirEditar,
    completar,
    pedirEliminar,
  }

  return (
    <TasksContext.Provider value={value}>
      {children}

      <TaskFormModal
        abierto={form.abierto}
        onCerrar={cerrarForm}
        onGuardar={guardar}
        tarea={form.tarea}
        fechaInicial={form.fecha}
        tareas={tareas}
      />

      <ConfirmModal
        abierto={!!aEliminar}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
        procesando={eliminando}
        titulo="Eliminar tarea"
        mensaje={
          aEliminar
            ? `Seguro que quieres eliminar "${aEliminar.titulo}"? Esta accion no se puede deshacer.`
            : ''
        }
      />
    </TasksContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks debe usarse dentro de <TasksProvider>')
  return ctx
}
