type Props = {
  value: number
  label?: string
  size?: 'sm' | 'lg'
  variant?: 'bar' | 'ring'
  color?: string
}

export function Gauge({ value, label, size = 'sm', variant = 'bar', color = 'var(--color-primary)' }: Props) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
  const pct = Math.round(v * 100)
  const complete = v >= 1 ? { 'data-complete': 'true' } : {}
  const aria = { role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label }

  if (variant === 'ring') {
    const r = size === 'lg' ? 52 : 20
    const stroke = size === 'lg' ? 10 : 5
    const c = 2 * Math.PI * r
    const box = (r + stroke) * 2
    return (
      <div {...aria} {...complete} className="relative inline-flex items-center justify-center">
        <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-90">
          <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
          <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - v)} className="transition-[stroke-dashoffset] duration-500 ease-out" />
        </svg>
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${size === 'lg' ? 'text-2xl font-bold' : 'text-[10px] font-semibold'}`}>
          <span>{pct}%</span>
          {label && size === 'lg' && <span className="text-xs font-normal text-ink-muted">{label}</span>}
        </div>
      </div>
    )
  }

  return (
    <div {...aria} {...complete} className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-ink-muted">
          <span>{label}</span><span>{pct}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-pill bg-line ${size === 'lg' ? 'h-3' : 'h-2'}`}>
        <div data-testid="gauge-fill" className="h-full rounded-pill transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
