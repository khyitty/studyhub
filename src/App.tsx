import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ToastProvider } from './components/ui'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { ProfileProvider } from './data/ProfileProvider'
import { Layout } from './components/layout/Layout'
import { MorePage } from './features/more/MorePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { GradesPage } from './features/grades/GradesPage'
import { HomePage } from './features/home/HomePage'
import { TimetablePage } from './features/timetable/TimetablePage'
import { GradPage } from './features/grad/GradPage'
import { PapersPage } from './features/papers/PapersPage'
import { ResearchPage } from './features/research/ResearchPage'

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-dvh items-center justify-center text-ink-muted">…</div>
  if (!user) return <LoginPage />
  return (
    <ProfileProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="papers" element={<PapersPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="grad" element={<GradPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProfileProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
