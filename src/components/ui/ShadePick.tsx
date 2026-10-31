import { SHADES, SHADE_CLASS } from '../../lib/theme'
import type { Shade } from '../../lib/types'

type Props = { value: Shade; onChange: (s: Shade) => void; label: string }

/** Six theme-shade swatches as a radio group. */
export function ShadePick({ value, onChange, label }: Props) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {SHADES.map((s) => (
        <button key={s} type="button" role="radio" aria-checked={value === s} aria-label={String(s)} onClick={() => onChange(s)}
          className={`h-6 w-6 rounded-[3px] ${SHADE_CLASS[s].fill} ${value === s ? 'ring-2 ring-ink ring-offset-1 ring-offset-surface' : ''}`} />
      ))}
    </div>
  )
}
