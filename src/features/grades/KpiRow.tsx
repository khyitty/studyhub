import { Tag } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import type { Grades } from './useGrades'

const fmt = (n: number | null) => (n == null ? '–' : n.toFixed(2))

function Cell({ label, value, denom, children }: { label: string; value: string; denom?: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-[22px] font-extrabold tracking-[-0.5px] tabular-nums">
        {value}{denom && <span className="ml-1 text-[11px] font-normal text-ink-muted">{denom}</span>}
      </p>
      {children}
    </div>
  )
}

export function KpiRow({ g }: { g: Grades }) {
  const t = useT()
  const { profile } = useProfile()
  const portal = profile.gpaPortal
  const diff = portal != null && g.cumulative.gpa != null ? Math.abs(portal - g.cumulative.gpa) : 0
  const mismatch = diff > 0.01
  const required = g.progress.total.required
  return (
    <div className="grid grid-cols-2 rounded-card border border-line-strong md:grid-cols-4 md:divide-x md:divide-line">
      <Cell label={t('grades.cumulative')} value={fmt(g.cumulative.gpa)} denom="/ 4.5">
        {mismatch && <Tag tone="warn" className="mt-1">{t('grades.portalDiff', { diff: diff.toFixed(2) })}</Tag>}
      </Cell>
      <Cell label={t('grades.major')} value={fmt(g.major.gpa)} denom="/ 4.5" />
      <Cell label={t('grades.earned')} value={`${g.progress.total.earned}`} denom={required ? `/ ${required}` : undefined} />
      <Cell label={t('grades.scale4')} value={fmt(g.scale4)} denom="/ 4.0" />
    </div>
  )
}
