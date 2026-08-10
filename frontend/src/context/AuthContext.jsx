// ============================================================================
//  AuthContext - maneja sesion JWT (Plan Maestro seccion 13 / Guia 18)
//
//  - Guarda el token en localStorage y lo restaura al recargar.
//  - Expone login, registrar y logout.
//  - Escucha el evento 'taskflow:no-autorizado' (emitido por api.js ante un
//    401) para cerrar la sesion automaticamente.
// ============================================================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '../services/authService.js'
import { setToken, clearToken, getToken } from '../services/api.js'

const USUARIO_KEY = 'taskflow_usuario'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Restaurar sesion al montar.
  useEffect(() => {
    const token = getToken()
    const raw = localStorage.getItem(USUARIO_KEY)
    if (token && raw) {
      try {
        setUsuario(JSON.parse(raw))
      } catch {
        clearToken()
        localStorage.removeItem(USUARIO_KEY)
      }
    }
    setCargando(false)
  }, [])

  const cerrarSesion = useCallback(() => {
    clearToken()
    localStorage.removeItem(USUARIO_KEY)
    setUsuario(null)
  }, [])

  // Cerrar sesion cuando la API responde 401.
  useEffect(() => {
    const handler = () => cerrarSesion()
    window.addEventListener('taskflow:no-autorizado', handler)
    return () => window.removeEventListener('taskflow:no-autorizado', handler)
  }, [cerrarSesion])

  function persistir({ token, usuario: u }) {
    setToken(token)
    localStorage.setItem(USUARIO_KEY, JSON.stringify(u))
    setUsuario(u)
    return u
  }

  async function login(credenciales) {
    const data = await authService.login(credenciales)
    return persistir(data)
  }

  async function registrar(datos) {
    const data = await authService.registrar(datos)
    return persistir(data)
  }

  const value = {
    usuario,
    cargando,
    estaAutenticado: !!usuario,
    login,
    registrar,
    cerrarSesion,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
