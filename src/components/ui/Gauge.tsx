type Props = {
  value: number
  label?: string
  size?: 'sm' | 'lg'
  color?: string
  /** keep the aria-label but do not render the label/percent row */
  hideLabel?: boolean
}

export function Gauge({ value, label, size = 'sm', color = 'var(--color-primary)', hideLabel = false }: Props) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
  const pct = Math.round(v * 100)
  const complete = v >= 1 ? { 'data-complete': 'true' } : {}
  const aria = { role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label }

  return (
    <div {...aria} {...complete} className="w-full">
      {label && !hideLabel && (
        <div className="mb-1 flex justify-between text-xs text-ink-muted">
          <span>{label}</span><span>{pct}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden bg-surface-2 ${size === 'lg' ? 'h-1.5' : 'h-1'}`}>
        <div data-testid="gauge-fill" className="h-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
