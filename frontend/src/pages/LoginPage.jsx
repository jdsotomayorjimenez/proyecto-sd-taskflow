import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { estaEnModoMock } from '../services/api.js'
import Logo from '../components/ui/Logo.jsx'
import { toggleTheme } from '../utils/theme.js'
import Button from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Field.jsx'
import { Alerta } from '../components/ui/Feedback.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login({ email, password })
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesion')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <button
            type="button"
            onClick={toggleTheme}
            title="Cambiar tema"
            aria-label="Cambiar entre modo claro y oscuro"
            className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_6px_18px_rgba(220,76,62,0.4)] transition-transform hover:scale-105 active:scale-95"
          >
            <Logo size={26} />
          </button>
          <h1 className="text-2xl font-bold text-ink">TaskFlow</h1>
          <p className="mt-1 text-sm text-muted">Tus tareas, en un solo lugar</p>
        </div>

        <div className="card-cloud p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            {error && <Alerta>{error}</Alerta>}

            <Field label="Correo" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@email.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Contrasena" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" size="lg" disabled={cargando} className="w-full">
              {cargando ? 'Entrando...' : 'Iniciar sesion'}
            </Button>
          </form>

          {estaEnModoMock() && (
            <p className="mt-4 rounded-[10px] bg-brand-soft px-3 py-2 text-center text-xs text-brand">
              Modo demo: demo@taskflow.com / demo123
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-brand hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  )
}
