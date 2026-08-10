import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/** Envuelve rutas privadas: redirige a /login si no hay sesion. */
export default function ProtectedRoute({ children }) {
  const { estaAutenticado, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center text-muted">
        Cargando...
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
