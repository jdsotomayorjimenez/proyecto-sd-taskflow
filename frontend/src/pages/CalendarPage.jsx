import { useMemo } from 'react'
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

export default function CalendarPage() {
  const { tareas, error, abrirCrear, abrirEditar } = useTasks()

  const eventos = useMemo(
    () =>
      tareas
        .filter((t) => t.fecha)
        .map((t) => {
          const dia = toISODate(t.fecha)
          const conHora = !!t.horaInicio
          const color = COLOR_ESTADO[t.estado] || '#DC4C3E'
          return {
            id: t._id,
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
        }),
    [tareas],
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
          dateClick={(info) => abrirCrear(info.date)}
          eventClick={(info) => abrirEditar(info.event.extendedProps.tarea)}
          dayMaxEvents={3}
        />
      </div>
    </div>
  )
}
