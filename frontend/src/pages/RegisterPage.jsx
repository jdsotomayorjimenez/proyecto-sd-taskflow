import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/ui/Logo.jsx'
import { toggleTheme } from '../utils/theme.js'
import Button from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Field.jsx'
import { Alerta } from '../components/ui/Feedback.jsx'

export default function RegisterPage() {
  const { registrar } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    setCargando(true)
    try {
      await registrar(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta')
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
          <h1 className="text-2xl font-bold text-ink">Crear cuenta</h1>
          <p className="mt-1 text-sm text-muted">Empieza a organizar tus tareas</p>
        </div>

        <div className="card-cloud p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            {error && <Alerta>{error}</Alerta>}

            <Field label="Nombre" htmlFor="nombre">
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </Field>

            <Field label="Correo" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="tucorreo@email.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Contrasena" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Minimo 6 caracteres"
                autoComplete="new-password"
                required
              />
            </Field>

            <Button type="submit" size="lg" disabled={cargando} className="w-full">
              {cargando ? 'Creando...' : 'Registrarse'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  )
}
