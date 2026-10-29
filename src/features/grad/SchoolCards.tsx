import { useT } from '../../i18n/useT'
import type { School } from '../../lib/types'
import { DeadlineCell, GreTag, RecsTag, SopTag, StatusCell, ToeflCell } from './SchoolCells'

type Props = { schools: School[]; today: string; mine: number | null; onOpen: (s: School) => void }

export function SchoolCards({ schools, today, mine, onOpen }: Props) {
  const t = useT()
  const row = 'flex items-center justify-between gap-3 border-t border-line/70 py-1.5'
  return (
    <ul className="space-y-2.5">
      {schools.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onOpen(s)} className="w-full rounded-card border border-line-strong p-3.5 text-left text-[13px] hover:bg-surface-2/40">
            <div className="flex items-start justify-between gap-3">
              <span className="font-bold">{s.name}</span>
              <DeadlineCell school={s} today={today} />
            </div>
            <p className="mb-2 mt-0.5 text-[11px] text-ink-muted">{s.program}{s.deadline ? ` · ${t('grad.deadline')} ${s.deadline}` : ''}</p>
            <div className={row}><span className="text-ink-muted">{t('grad.gre')}</span><GreTag gre={s.gre} /></div>
            <div className={row}><span className="text-ink-muted">{t('grad.toefl')}</span><ToeflCell school={s} mine={mine} /></div>
            <div className={row}><span className="text-ink-muted">{t('grad.recs')}</span><RecsTag school={s} /></div>
            <div className={row}><span className="text-ink-muted">{t('grad.sop')}</span><SopTag sop={s.sop} /></div>
            <div className={row}><span className="text-ink-muted">{t('grad.fee')}</span><span className="tabular-nums">{s.fee || '—'}</span></div>
            <div className={row}><span className="text-ink-muted">{t('grad.status')}</span><StatusCell status={s.status} /></div>
          </button>
        </li>
      ))}
    </ul>
  )
}
