import { useT } from '../../i18n/useT'
import { COVERS, type Cover as CoverKind } from '../../lib/theme'
import { Cover } from '../home/Cover'

type Props = { value: CoverKind; onChange: (c: CoverKind) => void; label: string }

/** Five home-cover options with a live miniature of each. */
export function CoverPicker({ value, onChange, label }: Props) {
  const t = useT()
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {COVERS.map((c) => {
        const on = c === value
        return (
          <button key={c} type="button" role="radio" aria-checked={on} aria-label={t(`settings.cover_${c}`)} onClick={() => onChange(c)}
            className={`rounded-card border p-1.5 text-left transition ${on ? 'border-ink' : 'border-line-strong hover:border-ink-faint'}`}>
            {c === 'none'
              ? <span className="block h-8 w-full rounded-[2px] border border-dashed border-line-strong" />
              : <Cover kind={c} compact />}
            <span className={`mt-1 block text-[11px] font-semibold ${on ? 'text-ink' : 'text-ink-muted'}`}>{t(`settings.cover_${c}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
