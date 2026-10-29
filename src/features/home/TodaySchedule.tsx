import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Card } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { KIND_STYLE, toMinutes, type ScheduleItem } from '../timetable/schedule'

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function TodaySchedule({ items }: { items: ScheduleItem[] }) {
  const t = useT()
  const [now, setNow] = useState(nowMinutes)
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <Card title={t('home.todaySchedule')} action={<Link to="/timetable" className="text-sm font-semibold text-ink-muted">{t('nav.timetable')} ›</Link>}>
      {items.length === 0 ? (
        <p className="py-3 text-center text-sm text-ink-muted">{t('home.noSchedule')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const st = KIND_STYLE[it.kind]
            const live = now >= toMinutes(it.start) && now < toMinutes(it.end)
            const past = now >= toMinutes(it.end)
            return (
              <li key={it.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${live ? 'bg-surface-2 ring-2 ring-peach-deep' : ''} ${past ? 'opacity-50' : ''}`}>
                <span className={`h-9 w-1.5 shrink-0 rounded-pill ${st.dot}`} />
                <span className="w-24 shrink-0 text-sm tabular-nums text-ink-muted">{it.start}–{it.end}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{it.title}</span>
                  {it.place && <span className="block truncate text-xs text-ink-muted">{it.place}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
