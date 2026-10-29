import type { ReactNode } from 'react'

export type TagTone = 'ok' | 'warn' | 'bad' | 'none'

const tones: Record<TagTone, string> = {
  ok: 'bg-success/12 text-success',
  warn: 'bg-warn/12 text-warn',
  bad: 'bg-danger/12 text-danger',
  none: 'bg-surface-2 text-ink-muted',
}

export function Tag({ tone, children, className = '' }: { tone: TagTone; children: ReactNode; className?: string }) {
  return <span className={`inline-block rounded-pill px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>{children}</span>
}
