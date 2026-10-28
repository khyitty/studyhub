import type { ReactNode } from 'react'

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card bg-surface-2 px-4 py-10 text-center">
      {icon && <div className="text-ink-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
