import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import type { Grades } from './useGrades'

const fmt = (n: number | null) => (n == null ? '–' : n.toFixed(2))

function Stat({ label, value, sub, big, tone }: { label: string; value: string; sub?: React.ReactNode; big?: boolean; tone: string }) {
  return (
    <div className={`rounded-card p-4 shadow-soft ${tone}`}>
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className={`mt-1 font-bold ${big ? 'text-4xl' : 'text-2xl'}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  )
}

export function SummaryCards({ g }: { g: Grades }) {
  const t = useT()
  const { profile } = useProfile()
  const portal = profile.gpaPortal
  const diff = portal != null && g.cumulative.gpa != null ? Math.abs(portal - g.cumulative.gpa) : 0
  const mismatch = diff > 0.01
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        label={t('grades.cumulative')} value={fmt(g.cumulative.gpa)} big tone="bg-peach col-span-2 sm:col-span-1"
        sub={portal != null && (
          <span className={`inline-flex items-center gap-1 ${mismatch ? 'rounded-pill bg-butter px-2 py-0.5 font-semibold text-butter-deep' : ''}`}>
            {mismatch && <span aria-hidden="true">⚠</span>}
            {t('grades.portalGpa', { gpa: portal.toFixed(2) })}
            {mismatch && ` · ${t('grades.portalMismatch', { diff: diff.toFixed(2) })}`}
          </span>
        )}
      />
      <Stat label={t('grades.scale4')} value={fmt(g.scale4)} tone="bg-lilac" />
      <Stat label={t('grades.major')} value={fmt(g.major.gpa)} tone="bg-mint" sub={t('grades.creditSum', { n: g.major.credits })} />
      <Stat label={t('grades.earned')} value={`${g.progress.total.earned}`} tone="bg-butter"
        sub={g.progress.total.required ? `/ ${g.progress.total.required}` : undefined} />
    </div>
  )
}
