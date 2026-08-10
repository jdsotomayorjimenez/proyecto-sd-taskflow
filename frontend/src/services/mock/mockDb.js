// ============================================================================
//  Almacen del backend simulado (mock) - persistido en localStorage.
//  Solo se usa cuando VITE_USE_MOCK === 'true' (desarrollo sin la Maquina A).
// ============================================================================

const K_USUARIOS = 'taskflow_mock_usuarios'
const K_TAREAS = 'taskflow_mock_tareas'
const K_SEED = 'taskflow_mock_seeded'

export function genId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  )
}

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const usuariosRepo = {
  all: () => load(K_USUARIOS),
  save: (arr) => save(K_USUARIOS, arr),
}

export const tareasRepo = {
  all: () => load(K_TAREAS),
  save: (arr) => save(K_TAREAS, arr),
}

/** Fecha relativa a hoy en ISO, con desplazamiento de dias. */
function fechaRelativa(offsetDias, hora = 9) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  d.setHours(hora, 0, 0, 0)
  return d.toISOString()
}

/** Siembra un usuario demo y tareas de ejemplo la primera vez. */
export function seedIfNeeded() {
  if (localStorage.getItem(K_SEED)) return

  const usuarioId = genId()
  usuariosRepo.save([
    {
      _id: usuarioId,
      nombre: 'Karel Demo',
      email: 'demo@taskflow.com',
      // En el mock guardamos la contrasena tal cual para poder compararla.
      // El backend real de Juan usara bcrypt (passwordHash).
      password: 'demo123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ])

  const base = (over) => ({
    _id: genId(),
    usuarioId,
    titulo: '',
    descripcion: '',
    estado: 'Pendiente',
    prioridad: 'Media',
    fecha: null,
    horaInicio: '',
    horaFin: '',
    repeticion: { tipo: 'ninguna', intervalo: 1, diasSemana: [], fechaFin: null },
    serieId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  })

  tareasRepo.save([
    // --- Pasadas ya hechas (Completadas) ---
    base({
      titulo: 'Estudiar Kubernetes',
      descripcion: 'Repasar Services, Deployments y ConfigMaps',
      estado: 'Completada',
      prioridad: 'Alta',
      fecha: fechaRelativa(-2, 19),
      horaInicio: '19:00',
      horaFin: '20:00',
    }),
    base({
      titulo: 'Configurar Tailscale',
      descripcion: 'Verificar que ambas maquinas se ven en la tailnet',
      estado: 'Completada',
      prioridad: 'Media',
      fecha: fechaRelativa(-2, 10),
    }),
    base({
      titulo: 'Terminar el frontend',
      descripcion: 'Conectar React con la API por Tailscale',
      estado: 'Completada',
      prioridad: 'Alta',
      fecha: fechaRelativa(-1, 21),
      horaInicio: '21:00',
      horaFin: '22:30',
    }),
    // --- Una sola vencida, creible que no se haya hecho ---
    base({
      titulo: 'Correr 10k',
      descripcion: 'Salir a entrenar antes de la entrega',
      estado: 'Pendiente',
      prioridad: 'Media',
      fecha: fechaRelativa(-1, 7),
      horaInicio: '07:00',
      horaFin: '08:00',
    }),
    // --- Para hoy ---
    base({
      titulo: 'Repasar para la exposicion',
      descripcion: 'Ensayar la demo de TaskFlow',
      estado: 'Pendiente',
      prioridad: 'Alta',
      fecha: fechaRelativa(0, 18),
      horaInicio: '18:00',
      horaFin: '19:00',
    }),
    // --- Proximas ---
    base({
      titulo: 'Reunion de avance del proyecto',
      descripcion: 'Sync con el equipo',
      estado: 'Pendiente',
      prioridad: 'Alta',
      fecha: fechaRelativa(2, 10),
      horaInicio: '10:00',
    }),
    base({
      titulo: 'Entrega final del examen',
      descripcion: 'Subir evidencias y exponer',
      estado: 'Pendiente',
      prioridad: 'Alta',
      fecha: fechaRelativa(5, 9),
      horaInicio: '09:00',
    }),
  ])

  localStorage.setItem(K_SEED, '1')
}
