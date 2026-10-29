import { useEffect, useRef, useState } from 'react'
import { Button, Confetti, Gauge } from '../../components/ui'
import { useLang, useT } from '../../i18n/useT'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from '../../data/useProfile'
import { levelProgress } from '../../lib/xp'
import { todayISO } from '../../lib/dates'
import { useTodos } from '../todos/useTodos'
import { useSchedule } from '../timetable/useSchedule'
import { TodayGauge } from './TodayGauge'
import { TodayTodos } from './TodayTodos'
import { TodaySchedule } from './TodaySchedule'

export function HomePage() {
  const t = useT()
  const lang = useLang()
  const { user } = useAuth()
  const { profile } = useProfile()
  const todos = useTodos()
  const schedule = useSchedule()
  const today = todayISO()
  const lp = levelProgress(profile.xp)

  // confetti once when today's completion crosses to 100%
  const [burst, setBurst] = useState(0)
  const prevRatio = useRef(todos.completionRatio)
  useEffect(() => {
    if (todos.today.length > 0 && prevRatio.current < 1 && todos.completionRatio >= 1) setBurst((b) => b + 1)
    prevRatio.current = todos.completionRatio
  }, [todos.completionRatio, todos.today.length])

  const dateLabel = new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', weekday: 'long' })
  const name = user?.displayName?.split(' ')[0] ?? ''

  return (
    <div className="space-y-4">
      <Confetti fire={burst} />
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-muted">{dateLabel}</p>
          <h1 className="mt-0.5 truncate text-2xl font-bold">{t('home.greeting', { name })}</h1>
        </div>
        <div className="w-28 shrink-0 rounded-card bg-lilac px-3 py-2 text-lilac-deep">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold">{t('home.level', { level: lp.level })}</span>
            <span className="text-[10px] font-semibold tabular-nums">{lp.current}/{lp.needed}</span>
          </div>
          <div className="mt-1"><Gauge value={lp.ratio} color="var(--color-lilac-deep)" /></div>
        </div>
      </header>

      {todos.overdue.length > 0 && (
        <div className="flex items-center gap-2 rounded-card bg-butter px-4 py-2 text-sm font-semibold text-butter-deep">
          <span className="flex-1">{t('home.overdue', { count: todos.overdue.length })}</span>
          <Button size="sm" variant="secondary" onClick={() => void todos.moveOverdueToToday()}>{t('home.moveToToday')}</Button>
        </div>
      )}

      <TodayGauge today={todos.today} ratio={todos.completionRatio} />
      <TodayTodos todos={todos} />
      <TodaySchedule items={schedule.onDate(today)} />
    </div>
  )
}
