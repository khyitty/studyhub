import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useT } from '../../i18n/useT'
import { kindOf, kindStyle, type Kind } from '../../lib/kinds'
import { toMinutes, type ScheduleItem } from '../timetable/schedule'

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function TodaySchedule({ items, kinds }: { items: ScheduleItem[]; kinds: Kind[] }) {
  const t = useT()
  const [now, setNow] = useState(nowMinutes)
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="py-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('home.todaySchedule')}</h2>
        <Link to="/timetable" className="text-xs text-ink-muted hover:text-s6">{t('nav.timetable')} ›</Link>
      </header>
      {items.length === 0 ? (
        <p className="py-3 text-[13px] text-ink-muted">{t('home.noSchedule')}</p>
      ) : (
        <ul className="mt-1">
          {items.map((it) => {
            const live = now >= toMinutes(it.start) && now < toMinutes(it.end)
            const past = now >= toMinutes(it.end)
            return (
              <li key={it.id} className={`flex items-center gap-3 py-1.5 text-[13px] ${past ? 'text-ink-faint' : ''}`}>
                <span className={`w-11 shrink-0 text-xs tabular-nums ${past ? '' : 'text-ink-muted'}`}>{it.start}</span>
                <span className={`h-[26px] w-[3px] shrink-0 ${kindStyle(kindOf(kinds, it.kind)).bar}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${live ? 'font-bold' : ''}`}>{it.title}</span>
                  {it.place && <span className="block truncate text-[11px] text-ink-muted">{it.place}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
