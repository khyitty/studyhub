import { Link } from 'react-router'
import { useT } from '../../i18n/useT'
import { formatShortDate } from '../../lib/dates'
import { dday, ddayLabel, nearestDeadlines } from '../../lib/schools'
import type { School } from '../../lib/types'

export function DeadlineList({ schools, today }: { schools: School[]; today: string }) {
  const t = useT()
  const list = nearestDeadlines(schools, today, 3)
  return (
    <section className="py-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('home.deadlines')}</h2>
        <Link to="/grad" className="text-xs text-ink-muted hover:text-s6">{t('nav.grad')} ›</Link>
      </header>
      {schools.length === 0 ? (
        <Link to="/grad" className="block py-3 text-[13px] text-ink-muted hover:text-ink">{t('home.noSchools')}</Link>
      ) : list.length === 0 ? (
        <p className="py-3 text-[13px] text-ink-muted">{t('common.empty')}</p>
      ) : (
        <ul className="mt-1">
          {list.map((s) => {
            const n = dday(s.deadline, today)
            return (
              <li key={s.id}>
                <Link to="/grad" className="flex items-center justify-between py-2 text-[13px] hover:bg-surface-2/60">
                  <span className="min-w-0 truncate">{s.name} <span className="text-ink-muted">· {formatShortDate(s.deadline)}</span></span>
                  <span className={`ml-3 shrink-0 font-bold tabular-nums ${n <= 7 ? 'text-danger' : ''}`}>{ddayLabel(n)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
