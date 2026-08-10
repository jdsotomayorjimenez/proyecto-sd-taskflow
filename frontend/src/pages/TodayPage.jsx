import { Plus } from 'lucide-react'
import { useTasks } from '../context/TasksContext.jsx'
import TaskCard from '../components/tasks/TaskCard.jsx'
import Button from '../components/ui/Button.jsx'
import { Spinner, EmptyState, Alerta } from '../components/ui/Feedback.jsx'
import { esHoy } from '../utils/dates.js'

export default function TodayPage() {
  const { tareas, cargando, error, abrirCrear, abrirEditar, pedirEliminar, completar } =
    useTasks()

  const deHoy = tareas
    .filter((t) => esHoy(t.fecha))
    .sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Hoy</h1>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString('es', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        {deHoy.length > 0 && (
          <Button onClick={() => abrirCrear(new Date())}>
            <Plus size={16} />
            Nueva tarea
          </Button>
        )}
      </div>

      {error && <Alerta>{error}</Alerta>}

      {cargando ? (
        <Spinner />
      ) : deHoy.length === 0 ? (
        <EmptyState
          titulo="Nada para hoy"
          descripcion="Disfruta tu dia o planifica algo nuevo."
          accion={
            <Button onClick={() => abrirCrear(new Date())}>
              <Plus size={16} />
              Nueva tarea
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {deHoy.map((t) => (
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
