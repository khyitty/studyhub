import type { ReactNode } from 'react'

type Props = {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bordered?: boolean
}

export function Card({ title, action, children, className = '', bordered = false }: Props) {
  return (
    <section className={`${bordered ? 'rounded-card border border-line-strong p-4' : 'py-4'} ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-bold">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
