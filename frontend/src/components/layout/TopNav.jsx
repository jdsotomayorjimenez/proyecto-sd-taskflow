import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Sun,
  CheckSquare,
  CalendarDays,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import HealthIndicator from './HealthIndicator.jsx'
import Logo from '../ui/Logo.jsx'
import { toggleTheme } from '../../utils/theme.js'

const NAV = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/hoy', label: 'Hoy', icon: Sun },
  { to: '/tareas', label: 'Mis tareas', icon: CheckSquare },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
]

export default function TopNav() {
  const { usuario, cerrarSesion } = useAuth()
  const [tema, setTema] = useState(
    () => document.documentElement.dataset.theme || 'light',
  )
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)

  // El cambio de tema (DOM + localStorage) vive en utils/theme.js; aqui solo
  // guardamos el valor nuevo para actualizar el icono y el texto del boton.
  function alternarTema() {
    setTema(toggleTheme())
  }

  useEffect(() => {
    if (!menu) return
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menu])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        {/* Izquierda: logo pegado al borde = toggle de tema */}
        <button
          onClick={alternarTema}
          title={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_2px_8px_rgba(220,76,62,0.4)] transition-transform hover:scale-105 active:scale-95"
        >
          <Logo size={19} />
        </button>

        {/* Centro: navegacion */}
        <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors md:px-4',
                  isActive
                    ? 'bg-brand-soft font-semibold text-brand'
                    : 'font-medium text-muted hover:bg-line/40 hover:text-ink',
                ].join(' ')
              }
            >
              <Icon size={17} />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Derecha: cuenta (menu con salud + cerrar sesion) */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-1 transition-colors hover:bg-line/40 sm:pr-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {(usuario?.nombre || '?').charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[120px] truncate text-xs font-semibold text-ink sm:block">
              {usuario?.nombre}
            </span>
            <ChevronDown
              size={15}
              className={`hidden text-muted transition-transform sm:block ${menu ? 'rotate-180' : ''}`}
            />
          </button>

          {menu && (
            <div className="card-cloud absolute right-0 z-50 mt-2 w-64 p-2">
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                  {(usuario?.nombre || '?').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {usuario?.nombre}
                  </p>
                  <p className="truncate text-xs text-muted">{usuario?.email}</p>
                </div>
              </div>

              <div className="px-2 py-1">
                <HealthIndicator />
              </div>

              <div className="my-1 border-t border-line" />

              <button
                onClick={cerrarSesion}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-vencida transition-colors hover:bg-vencida/10"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
