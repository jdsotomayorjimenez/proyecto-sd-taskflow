import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { Field, Input, Textarea } from '../ui/Field.jsx'
import Select from '../ui/Select.jsx'
import DateField from '../ui/DateField.jsx'
import TimeRange from '../ui/TimeRange.jsx'
import { Alerta } from '../ui/Feedback.jsx'
import { ESTADOS, PRIORIDADES, RECURRENCIAS, DIAS_SEMANA } from '../../constants.js'
import { toISODate } from '../../utils/dates.js'

const REP_VACIA = { tipo: 'ninguna', intervalo: 1, diasSemana: [], fechaFin: null }

const opts = (arr) => arr.map((v) => ({ value: v, label: v }))
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function estadoInicial(tarea, fechaInicial) {
  return {
    titulo: tarea?.titulo || '',
    descripcion: tarea?.descripcion || '',
    estado: tarea?.estado || 'Pendiente',
    prioridad: tarea?.prioridad || 'Media',
    fecha: tarea?.fecha
      ? toISODate(tarea.fecha)
      : fechaInicial
        ? toISODate(fechaInicial)
        : '',
    horaInicio: tarea?.horaInicio || '',
    horaFin: tarea?.horaFin || '',
    repeticion: { ...REP_VACIA, ...(tarea?.repeticion || {}) },
  }
}

/**
 * Formulario de tarea reutilizable para crear y editar.
 * @param {object} props
 * @param {object|null} props.tarea    tarea a editar (null = crear)
 * @param {Date|string} props.fechaInicial  fecha preseleccionada (calendario)
 * @param {(datos)=>Promise} props.onGuardar
 */
export default function TaskFormModal({
  abierto,
  onCerrar,
  onGuardar,
  tarea = null,
  fechaInicial = null,
  tareas = [],
}) {
  const [form, setForm] = useState(estadoInicial(tarea, fechaInicial))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (abierto) {
      setForm(estadoInicial(tarea, fechaInicial))
      setError('')
    }
  }, [abierto, tarea, fechaInicial])

  const editando = !!tarea
  const esRecurrente = form.repeticion.tipo !== 'ninguna'
  const esSemanal = form.repeticion.tipo === 'semanal'

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }
  function setRep(campo, valor) {
    setForm((f) => ({ ...f, repeticion: { ...f.repeticion, [campo]: valor } }))
  }

  function toggleDia(valor) {
    setForm((f) => {
      const dias = f.repeticion.diasSemana.includes(valor)
        ? f.repeticion.diasSemana.filter((d) => d !== valor)
        : [...f.repeticion.diasSemana, valor]
      return { ...f, repeticion: { ...f.repeticion, diasSemana: dias } }
    })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!form.titulo.trim()) {
      setError('El titulo es obligatorio')
      return
    }

    const ini = form.horaInicio
    const fin = form.horaFin

    // El horario es opcional, pero si se pone uno hay que poner ambos.
    if ((ini && !fin) || (!ini && fin)) {
      setError('Indica la hora de inicio y la de fin (o deja ambas vacias).')
      return
    }
    // La hora de fin debe ser posterior a la de inicio.
    if (ini && fin && fin <= ini) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      return
    }
    // Un horario necesita una fecha para ubicarse en el calendario.
    if ((ini || fin) && !form.fecha) {
      setError('Elige una fecha para la tarea con horario.')
      return
    }
    // No se permiten dos tareas solapadas el mismo dia y horario.
    if (form.fecha && ini && fin) {
      const choca = tareas.find((t) => {
        if (t._id === tarea?._id) return false
        if (t.estado === 'Completada') return false
        if (!t.fecha || !t.horaInicio || !t.horaFin) return false
        if (toISODate(t.fecha) !== form.fecha) return false
        return ini < t.horaFin && fin > t.horaInicio
      })
      if (choca) {
        setError(
          `Ya tienes una tarea en ese horario: "${choca.titulo}" (${choca.horaInicio}-${choca.horaFin}).`,
        )
        return
      }
    }

    // Construir payload segun el contrato de la API.
    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      estado: form.estado,
      prioridad: form.prioridad,
      fecha: form.fecha ? new Date(form.fecha + 'T00:00:00').toISOString() : null,
      // El backend rechaza cadenas vacias ("horaInicio debe tener formato HH:MM").
      // Cuando el horario se deja en blanco enviamos null (que el backend acepta).
      horaInicio: form.horaInicio || null,
      horaFin: form.horaFin || null,
      repeticion: esRecurrente
        ? {
            tipo: form.repeticion.tipo,
            intervalo: Math.max(1, Number(form.repeticion.intervalo) || 1),
            diasSemana: esSemanal ? form.repeticion.diasSemana : [],
            fechaFin: form.repeticion.fechaFin || null,
          }
        : { ...REP_VACIA },
    }

    setGuardando(true)
    try {
      await onGuardar(payload)
      onCerrar()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la tarea')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? 'Editar tarea' : 'Nueva tarea'}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form" disabled={guardando}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="flex flex-col gap-4">
        {error && <Alerta>{error}</Alerta>}

        <Field label="Titulo" htmlFor="titulo">
          <Input
            id="titulo"
            value={form.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            placeholder="Ej. Estudiar Kubernetes"
            autoFocus
          />
        </Field>

        <Field label="Descripcion" htmlFor="descripcion">
          <Textarea
            id="descripcion"
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Detalles opcionales..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado" htmlFor="estado">
            <Select
              id="estado"
              value={form.estado}
              onChange={(v) => set('estado', v)}
              options={opts(ESTADOS)}
            />
          </Field>

          <Field label="Prioridad" htmlFor="prioridad">
            <Select
              id="prioridad"
              value={form.prioridad}
              onChange={(v) => set('prioridad', v)}
              options={opts(PRIORIDADES)}
            />
          </Field>
        </div>

        <Field label="Fecha" htmlFor="fecha">
          <DateField id="fecha" value={form.fecha} onChange={(v) => set('fecha', v)} />
        </Field>

        <Field label="Horario (opcional)">
          <TimeRange
            inicio={form.horaInicio}
            fin={form.horaFin}
            onInicio={(v) => set('horaInicio', v)}
            onFin={(v) => set('horaFin', v)}
          />
        </Field>

        {/* Recurrencia */}
        <div className="rounded-2xl border border-line p-3">
          <Field label="Repeticion" htmlFor="repTipo">
            <Select
              id="repTipo"
              value={form.repeticion.tipo}
              onChange={(v) => setRep('tipo', v)}
              options={RECURRENCIAS.map((r) => ({ value: r, label: cap(r) }))}
            />
          </Field>

          {esRecurrente && (
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Cada (intervalo)" htmlFor="intervalo">
                <Input
                  id="intervalo"
                  type="number"
                  min="1"
                  value={form.repeticion.intervalo}
                  onChange={(e) => setRep('intervalo', e.target.value)}
                />
              </Field>

              {esSemanal && (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink">
                    Dias de la semana
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DIAS_SEMANA.map(({ valor, etiqueta }) => {
                      const activo = form.repeticion.diasSemana.includes(valor)
                      return (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => toggleDia(valor)}
                          className={[
                            'h-9 w-9 rounded-full text-xs font-semibold transition-colors',
                            activo
                              ? 'bg-brand text-white'
                              : 'bg-canvas text-muted hover:bg-brand-soft hover:text-brand',
                          ].join(' ')}
                        >
                          {etiqueta}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <Field label="Termina el (opcional)" htmlFor="fechaFin">
                <DateField
                  id="fechaFin"
                  value={form.repeticion.fechaFin ? toISODate(form.repeticion.fechaFin) : ''}
                  onChange={(v) =>
                    setRep(
                      'fechaFin',
                      v ? new Date(v + 'T00:00:00').toISOString() : null,
                    )
                  }
                />
              </Field>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
