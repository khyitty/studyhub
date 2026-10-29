type Props<T extends string> = {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
  className?: string
}

export function Segmented<T extends string>({ value, options, onChange, label, className = '' }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-pill border border-line-strong p-[3px] ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 flex-1 whitespace-nowrap rounded-pill px-3 text-sm font-semibold transition ${value === o.value ? 'bg-primary text-on-primary' : 'text-ink-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
