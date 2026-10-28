import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Ctx = { show: (message: string) => void }
const ToastContext = createContext<Ctx>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((message: string) => {
    setMsg(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 3000)
  }, [])
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {msg && (
        <div role="status" className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-pill bg-ink px-4 py-2 text-sm font-semibold text-bg shadow-soft">
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
