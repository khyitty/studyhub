import { Link } from 'react-router'
import { Gauge } from '../../components/ui'
import { useT } from '../../i18n/useT'
import type { Grades } from './useGrades'

const ROWS = [
  { key: 'total', labelKey: 'grades.reqTotal', color: 'var(--color-ink)' },
  { key: 'major', labelKey: 'grades.reqMajor', color: 'var(--color-sky)' },
  { key: 'liberal', labelKey: 'grades.reqLiberal', color: 'var(--color-mint)' },
] as const

export function GradGauges({ g }: { g: Grades }) {
  const t = useT()
  const anyMissing = ROWS.some((r) => !g.progress[r.key].required)
  return (
    <section className="py-4">
      <h2 className="text-sm font-bold">{t('grades.gradReq')}</h2>
      <div className="mt-1">
        {ROWS.map(({ key, labelKey, color }) => {
          const { earned, required } = g.progress[key]
          return (
            <div key={key} className="py-1.5">
              <div className="flex justify-between text-[13px]">
                <span>{t(labelKey)}</span>
                <span className="font-bold tabular-nums">{required ? `${earned} / ${required}` : earned}</span>
              </div>
              <div className="mt-1.5"><Gauge value={required ? earned / required : 0} color={color} size="sm" label={t(labelKey)} hideLabel /></div>
            </div>
          )
        })}
      </div>
      {anyMissing && (
        <Link to="/settings" className="mt-2 block text-xs text-ink-muted underline">{t('grades.setReqHint')}</Link>
      )}
    </section>
  )
}
