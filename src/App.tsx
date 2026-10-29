import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ToastProvider } from './components/ui'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { ProfileProvider } from './data/ProfileProvider'
import { Layout } from './components/layout/Layout'
import { Placeholder } from './components/layout/Placeholder'
import { MorePage } from './features/more/MorePage'
import { SettingsPage } from './features/settings/SettingsPage'

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-dvh items-center justify-center text-ink-muted">…</div>
  if (!user) return <LoginPage />
  return (
    <ProfileProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Placeholder titleKey="nav.home" />} />
          <Route path="grades" element={<Placeholder titleKey="nav.grades" />} />
          <Route path="timetable" element={<Placeholder titleKey="nav.timetable" />} />
          <Route path="papers" element={<Placeholder titleKey="nav.papers" />} />
          <Route path="research" element={<Placeholder titleKey="nav.research" />} />
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
