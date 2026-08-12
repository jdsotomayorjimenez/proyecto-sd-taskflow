import { useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus } from 'lucide-react'
import { useTasks } from '../context/TasksContext.jsx'
import Button from '../components/ui/Button.jsx'
import { Alerta } from '../components/ui/Feedback.jsx'
import { COLOR_ESTADO } from '../constants.js'
import { toISODate } from '../utils/dates.js'
import { ocurrenciasEnRango } from '../utils/recurrence.js'

/** Rango visible por defecto (mes actual + margen) hasta que FullCalendar avise. */
function rangoPorDefecto() {
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  desde.setDate(desde.getDate() - 7)
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  hasta.setDate(hasta.getDate() + 8)
  return { desde, hasta }
}

export default function CalendarPage() {
  const { tareas, error, abrirCrear, abrirEditar } = useTasks()
  // Rango de dias que el calendario esta mostrando; lo actualiza `datesSet`.
  const [rango, setRango] = useState(rangoPorDefecto)

  // Cada tarea se expande en una ocurrencia por cada dia (dentro del rango
  // visible) en que se repite. Asi una tarea semanal Mar+Mie aparece en cada
  // martes y miercoles, y una diaria sin fin aparece todos los dias.
  const eventos = useMemo(
    () =>
      tareas
        .filter((t) => t.fecha)
        .flatMap((t) => {
          const conHora = !!t.horaInicio
          const color = COLOR_ESTADO[t.estado] || '#DC4C3E'
          // Una tarea Completada es una ocurrencia ya cerrada: se muestra solo
          // en su propio dia, NO se proyecta al futuro. Solo las tareas activas
          // (Pendiente / En progreso) previsualizan la serie recurrente.
          const tareaParaExpandir =
            t.estado === 'Completada' ? { ...t, repeticion: null } : t
          return ocurrenciasEnRango(tareaParaExpandir, rango.desde, rango.hasta).map((fecha) => {
            const dia = toISODate(fecha)
            return {
              id: `${t._id}::${dia}`,
              title: t.titulo,
              start: conHora ? `${dia}T${t.horaInicio}` : dia,
              end: t.horaFin ? `${dia}T${t.horaFin}` : undefined,
              allDay: !conHora,
              // Bloque suave: fondo tenue del color de estado + texto del color.
              backgroundColor: color + '22',
              borderColor: 'transparent',
              textColor: color,
              extendedProps: { tarea: t },
            }
          })
        }),
    [tareas, rango],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Calendario</h1>
          <p className="text-sm text-muted">
            Haz clic en un dia para crear, o en una tarea para editar.
          </p>
        </div>
        <Button onClick={() => abrirCrear()}>
          <Plus size={16} />
          Nueva tarea
        </Button>
      </div>

      {error && <Alerta>{error}</Alerta>}

      <div className="card-cloud p-3 sm:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          firstDay={1}
          allDayText="Todo el día"
          eventDisplay="block"
          views={{ dayGridMonth: { displayEventTime: false } }}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
          }}
          events={eventos}
          datesSet={(info) => setRango({ desde: info.start, hasta: info.end })}
          dateClick={(info) => abrirCrear(info.date)}
          eventClick={(info) => abrirEditar(info.event.extendedProps.tarea)}
          dayMaxEvents={3}
        />
      </div>
    </div>
  )
}
