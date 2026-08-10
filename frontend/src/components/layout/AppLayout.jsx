import { Outlet } from 'react-router-dom'
import TopNav from './TopNav.jsx'

/** Layout de navegacion superior a ancho completo. */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
