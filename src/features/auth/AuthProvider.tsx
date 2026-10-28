import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth'
import { auth } from '../../firebase'

type Ctx = { user: User | null; loading: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<Ctx>({ user: null, loading: true, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false) }), [])
  return (
    <AuthContext.Provider value={{ user, loading, signOut: () => fbSignOut(auth) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

/** Use inside screens that only render when signed in. */
export function useUid(): string {
  const { user } = useAuth()
  if (!user) throw new Error('useUid called while signed out')
  return user.uid
}
