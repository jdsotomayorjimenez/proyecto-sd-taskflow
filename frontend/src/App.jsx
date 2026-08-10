import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TodayPage from './pages/TodayPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import { TasksProvider } from './context/TasksContext.jsx'

export default function App() {
  return (
    <Routes>
      {/* Publicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Privadas */}
      <Route
        element={
          <ProtectedRoute>
            <TasksProvider>
              <AppLayout />
            </TasksProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/hoy" element={<TodayPage />} />
        <Route path="/tareas" element={<TasksPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
