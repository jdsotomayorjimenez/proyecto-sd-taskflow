import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useTasks } from '../context/TasksContext.jsx'
import TaskCard from '../components/tasks/TaskCard.jsx'
import Button from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Field.jsx'
import Select from '../components/ui/Select.jsx'
import { Spinner, EmptyState, Alerta } from '../components/ui/Feedback.jsx'
import { ESTADOS, PRIORIDADES } from '../constants.js'

export default function TasksPage() {
  const { tareas, cargando, error, abrirCrear, abrirEditar, pedirEliminar, completar } =
    useTasks()

  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('todos')
  const [prioridad, setPrioridad] = useState('todas')

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return tareas
      .filter((t) => (estado === 'todos' ? true : t.estado === estado))
      .filter((t) => (prioridad === 'todas' ? true : t.prioridad === prioridad))
      .filter((t) =>
        q
          ? t.titulo.toLowerCase().includes(q) ||
            (t.descripcion || '').toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        // Sin fecha al final; con fecha, mas proxima primero.
        if (!a.fecha && !b.fecha) return 0
        if (!a.fecha) return 1
        if (!b.fecha) return -1
        return new Date(a.fecha) - new Date(b.fecha)
      })
  }, [tareas, busqueda, estado, prioridad])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mis tareas</h1>
          <p className="text-sm text-muted">{tareas.length} tareas en total</p>
        </div>
        {tareas.length > 0 && (
          <Button onClick={() => abrirCrear()}>
            <Plus size={16} />
            Nueva tarea
          </Button>
        )}
      </div>

      {error && <Alerta>{error}</Alerta>}

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tareas..."
            className="pl-9"
          />
        </div>
        <Select
          value={estado}
          onChange={setEstado}
          className="sm:w-44"
          options={[
            { value: 'todos', label: 'Todos los estados' },
            ...ESTADOS.map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          value={prioridad}
          onChange={setPrioridad}
          className="sm:w-44"
          options={[
            { value: 'todas', label: 'Toda prioridad' },
            ...PRIORIDADES.map((p) => ({ value: p, label: p })),
          ]}
        />
      </div>

      {/* Lista */}
      {cargando ? (
        <Spinner />
      ) : filtradas.length === 0 ? (
        <EmptyState
          titulo={tareas.length === 0 ? 'Aun no hay tareas' : 'Sin resultados'}
          descripcion={
            tareas.length === 0
              ? 'Crea tu primera tarea para empezar.'
              : 'Prueba a cambiar los filtros de busqueda.'
          }
          accion={
            tareas.length === 0 ? (
              <Button onClick={() => abrirCrear()}>
                <Plus size={16} />
                Nueva tarea
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtradas.map((t) => (
            <TaskCard
              key={t._id}
              tarea={t}
              onEditar={abrirEditar}
              onEliminar={pedirEliminar}
              onCompletar={completar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
