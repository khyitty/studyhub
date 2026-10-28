import type { ReactNode } from 'react'

type Props = {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'surface' | 'peach' | 'lilac' | 'mint' | 'butter'
}

const tones = { surface: 'bg-surface', peach: 'bg-peach', lilac: 'bg-lilac', mint: 'bg-mint', butter: 'bg-butter' }

export function Card({ title, action, children, className = '', tone = 'surface' }: Props) {
  return (
    <section className={`rounded-card p-4 shadow-soft ${tones[tone]} ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
