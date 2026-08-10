import { Plus } from 'lucide-react'
import { useTasks } from '../context/TasksContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import TaskCard from '../components/tasks/TaskCard.jsx'
import Button from '../components/ui/Button.jsx'
import { Spinner, EmptyState, Alerta } from '../components/ui/Feedback.jsx'
import { esHoy, esVencida } from '../utils/dates.js'

function StatCard({ valor, etiqueta, color }) {
  return (
    <div className="card-cloud p-5">
      <span className="stat-num block text-4xl font-bold text-ink">{valor}</span>
      <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {etiqueta}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { tareas, cargando, error, abrirCrear, abrirEditar, pedirEliminar, completar } =
    useTasks()
  const { usuario } = useAuth()

  // KPIs tipo "embudo": de todo lo que queda por hacer, cuanto es urgente
  // (vencido), cuanto es para hoy, y cuanto ya esta hecho.
  const porHacer = tareas.filter((t) => t.estado !== 'Completada').length
  const vencidasCount = tareas.filter((t) => esVencida(t)).length
  const paraHoy = tareas.filter(
    (t) => esHoy(t.fecha) && t.estado !== 'Completada',
  ).length
  const completadas = tareas.filter((t) => t.estado === 'Completada').length

  // "Proximas" = tareas futuras (hoy en adelante), NO las ya vencidas.
  const proximas = tareas
    .filter((t) => t.estado !== 'Completada' && t.fecha && !esVencida(t))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 5)

  // "Vencidas" = tareas con fecha en el pasado y sin completar.
  const vencidas = tareas
    .filter((t) => esVencida(t))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Hola, {usuario?.nombre?.split(' ')[0] || 'usuario'}
          </h1>
          <p className="text-sm text-muted">Este es tu resumen de hoy.</p>
        </div>
        {proximas.length > 0 && (
          <Button onClick={() => abrirCrear()}>
            <Plus size={16} />
            Nueva tarea
          </Button>
        )}
      </div>

      {error && <Alerta>{error}</Alerta>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard valor={porHacer} etiqueta="Por hacer" color="#E08A00" />
        <StatCard valor={vencidasCount} etiqueta="Vencidas" color="#C0392B" />
        <StatCard valor={paraHoy} etiqueta="Para hoy" color="#D9662B" />
        <StatCard valor={completadas} etiqueta="Completadas" color="#6E9153" />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">Próximas tareas</h2>
        {cargando ? (
          <Spinner />
        ) : proximas.length === 0 ? (
          <EmptyState
            titulo="No tienes tareas proximas"
            descripcion="Crea una tarea para empezar a organizarte."
            accion={
              <Button onClick={() => abrirCrear()}>
                <Plus size={16} />
                Nueva tarea
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {proximas.map((t) => (
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

      {vencidas.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
            Vencidas
            <span className="text-sm font-normal text-muted">({vencidas.length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {vencidas.map((t) => (
              <TaskCard
                key={t._id}
                tarea={t}
                onEditar={abrirEditar}
                onEliminar={pedirEliminar}
                onCompletar={completar}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
