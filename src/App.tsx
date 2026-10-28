import { ToastProvider, Button } from './components/ui'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'

function Gate() {
  const { user, loading, signOut } = useAuth()
  if (loading) return <div className="flex min-h-dvh items-center justify-center text-ink-muted">…</div>
  if (!user) return <LoginPage />
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">안녕, {user.displayName}</h1>
      <Button variant="secondary" onClick={signOut}>로그아웃</Button>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ToastProvider>
  )
}
