import { Link } from 'react-router'
import { Card, Gauge } from '../../components/ui'
import { useT } from '../../i18n/useT'
import type { Grades } from './useGrades'

const ROWS = [
  { key: 'total', labelKey: 'grades.reqTotal', color: 'var(--color-peach-deep)' },
  { key: 'major', labelKey: 'grades.reqMajor', color: 'var(--color-lilac-deep)' },
  { key: 'liberal', labelKey: 'grades.reqLiberal', color: 'var(--color-mint-deep)' },
] as const

export function GradGauges({ g }: { g: Grades }) {
  const t = useT()
  const anyMissing = ROWS.some((r) => !g.progress[r.key].required)
  return (
    <Card title={t('grades.gradReq')}>
      <div className="space-y-3">
        {ROWS.map(({ key, labelKey, color }) => {
          const { earned, required } = g.progress[key]
          return (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{t(labelKey)}</span>
                <span className="text-ink-muted">{required ? t('grades.creditsOf', { earned, required }) : t('grades.creditSum', { n: earned })}</span>
              </div>
              <Gauge value={required ? earned / required : 0} color={color} />
            </div>
          )
        })}
      </div>
      {anyMissing && (
        <Link to="/settings" className="mt-3 block text-xs text-ink-muted underline">{t('grades.setReqHint')}</Link>
      )}
    </Card>
  )
}
