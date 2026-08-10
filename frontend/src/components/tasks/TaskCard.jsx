import { Check, Pencil, Trash2, Repeat } from 'lucide-react'
import { COLOR_ESTADO, COLOR_PRIORIDAD } from '../../constants.js'
import { etiquetaFecha, esVencida } from '../../utils/dates.js'

/**
 * Tarjeta de tarea (estilo "Warm Calm", inspirada en Things 3):
 *  - el circulo de completar se tine con el color de la PRIORIDAD (punto de color)
 *  - la meta va en una sola linea serena (punto + texto), sin badges apilados
 */
export default function TaskCard({ tarea, onEditar, onEliminar, onCompletar }) {
  const vencida = esVencida(tarea)
  const completada = tarea.estado === 'Completada'
  const recurrente = tarea.repeticion && tarea.repeticion.tipo !== 'ninguna'

  const colorPrioridad = COLOR_PRIORIDAD[tarea.prioridad] || '#A79E8E'
  const colorEstado = COLOR_ESTADO[tarea.estado] || '#7C766C'

  return (
    <div className="card-cloud group p-4 transition-all hover:-translate-y-0.5">
      <div className="flex items-start gap-3.5">
        {/* Completar: circulo tenido por la prioridad; al completar se llena */}
        <button
          onClick={() => !completada && onCompletar?.(tarea)}
          disabled={completada}
          title={completada ? 'Completada' : 'Marcar como completada'}
          className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
          style={
            completada
              ? { backgroundColor: colorEstado, borderColor: colorEstado, color: '#fff' }
              : { borderColor: colorPrioridad, color: colorPrioridad }
          }
        >
          {completada ? (
            <Check size={13} strokeWidth={3} className="check-pop" />
          ) : (
            <Check
              size={13}
              strokeWidth={3}
              className="opacity-0 transition-opacity group-hover:opacity-60"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={[
              'font-semibold leading-snug text-ink',
              completada && 'text-muted line-through',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {tarea.titulo}
          </p>
          {tarea.descripcion && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted">
              {tarea.descripcion}
            </p>
          )}

          {/* Meta serena en una sola linea */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: colorEstado }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colorEstado }} />
              {tarea.estado}
            </span>
            <span className="text-[#CFC7B8]">·</span>
            <span style={{ color: colorPrioridad }}>{tarea.prioridad}</span>
            {tarea.fecha && (
              <>
                <span className="text-[#CFC7B8]">·</span>
                <span className={vencida && !completada ? 'font-medium text-vencida' : ''}>
                  {etiquetaFecha(tarea.fecha)}
                  {tarea.horaInicio ? ` · ${tarea.horaInicio}` : ''}
                  {vencida && !completada ? ' · vencida' : ''}
                </span>
              </>
            )}
            {recurrente && (
              <>
                <span className="text-[#CFC7B8]">·</span>
                <span className="inline-flex items-center gap-1">
                  <Repeat size={12} />
                  {tarea.repeticion.tipo}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Acciones (aparecen al pasar el cursor) */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEditar?.(tarea)}
            title="Editar"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-brand"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onEliminar?.(tarea)}
            title="Eliminar"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-vencida/10 hover:text-vencida"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
