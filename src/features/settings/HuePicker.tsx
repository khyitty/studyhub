import { useT } from '../../i18n/useT'
import { HUES, HUE_RAMP, type Hue } from '../../lib/theme'

type Props = { value: Hue; onChange: (h: Hue) => void; label: string }

/** Six preset accents, each shown as its light ramp. Saves immediately via onChange. */
export function HuePicker({ value, onChange, label }: Props) {
  const t = useT()
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {HUES.map((h) => {
        const on = h === value
        return (
          <button key={h} type="button" role="radio" aria-checked={on} aria-label={t(`settings.hue_${h}`)} onClick={() => onChange(h)}
            className={`rounded-card border p-1.5 text-left transition ${on ? 'border-ink' : 'border-line-strong hover:border-ink-faint'}`}>
            <span className="flex h-6 w-full overflow-hidden rounded-[2px]">
              {HUE_RAMP[h].light.map((hex, i) => <span key={i} data-shade={i + 1} className="flex-1" style={{ background: hex }} />)}
            </span>
            <span className={`mt-1 block text-[11px] font-semibold ${on ? 'text-ink' : 'text-ink-muted'}`}>{t(`settings.hue_${h}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
