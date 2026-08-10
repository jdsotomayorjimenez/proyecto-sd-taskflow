// ============================================================================
//  Indicador "Backend conectado" (Plan Maestro seccion 6.2 / 11.1)
//  Hace ping periodico a GET /api/health. Es la prueba visual de que el
//  frontend de la Maquina B alcanza el backend de la Maquina A por Tailscale.
// ============================================================================
import { useEffect, useState } from 'react'
import { authService } from '../../services/authService.js'
import { estaEnModoMock, getApiUrl } from '../../services/api.js'

const INTERVALO_MS = 15000

export default function HealthIndicator({ compact = false }) {
  const [estado, setEstado] = useState('checando') // 'ok' | 'error' | 'checando'

  useEffect(() => {
    let activo = true

    async function chequear() {
      try {
        await authService.health()
        if (activo) setEstado('ok')
      } catch {
        if (activo) setEstado('error')
      }
    }

    chequear()
    const id = setInterval(chequear, INTERVALO_MS)
    return () => {
      activo = false
      clearInterval(id)
    }
  }, [])

  const mock = estaEnModoMock()
  const color =
    estado === 'ok' ? '#6E9153' : estado === 'error' ? '#C0392B' : '#E08A00'
  const texto =
    estado === 'ok'
      ? mock
        ? 'Backend conectado (mock)'
        : 'Backend conectado'
      : estado === 'error'
        ? 'Backend desconectado'
        : 'Comprobando...'

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5"
        title={mock ? 'Modo mock' : getApiUrl()}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 0 3px ${color}22` }}
        />
        <span className="text-xs font-medium text-ink">{texto}</span>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-line px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 0 3px ${color}22`,
          }}
        />
        <span className="text-xs font-semibold text-ink">{texto}</span>
      </div>
      {!mock && (
        <p className="mt-1 truncate text-[11px] text-muted" title={getApiUrl()}>
          {getApiUrl() || 'API_URL no configurada'}
        </p>
      )}
    </div>
  )
}
