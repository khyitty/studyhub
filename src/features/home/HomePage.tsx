import { useEffect, useRef, useState } from 'react'
import { Button, Confetti } from '../../components/ui'
import { useLang, useT } from '../../i18n/useT'
import { useAuth } from '../auth/AuthProvider'
import { formatDateHeading, formatShortDate, todayISO } from '../../lib/dates'
import { groupTodos } from '../../lib/categories'
import { useTodos } from '../todos/useTodos'
import { useCategories } from '../todos/useCategories'
import { useSchedule } from '../timetable/useSchedule'
import { WeekStrip } from './WeekStrip'
import { CategoryTodos } from './CategoryTodos'
import { CompletionStat } from './CompletionStat'
import { CategoryManager } from './CategoryManager'
import { TodaySchedule } from './TodaySchedule'
import { DeadlineList } from './DeadlineList'
import { useSchools } from '../grad/useSchools'

export function HomePage() {
  const t = useT()
  const lang = useLang()
  const { user } = useAuth()
  const today = todayISO()
  const [selected, setSelected] = useState(today)
  const todos = useTodos(selected)
  const { categories } = useCategories()
  const schedule = useSchedule()
  const { schools } = useSchools()
  const [manage, setManage] = useState(false)

  // confetti once when today's completion crosses to 100%
  const [burst, setBurst] = useState(0)
  const prevRatio = useRef(todos.completionRatio)
  useEffect(() => {
    if (todos.today.length > 0 && prevRatio.current < 1 && todos.completionRatio >= 1) setBurst((b) => b + 1)
    prevRatio.current = todos.completionRatio
  }, [todos.completionRatio, todos.today.length])

  const isToday = selected === today
  const name = user?.displayName?.split(' ')[0] ?? ''
  const groups = groupTodos(todos.selected, categories)
  const dateWord = isToday ? t('common.today') : formatShortDate(selected)
  const completionTitle = isToday ? t('home.completion') : t('home.completionOn', { date: dateWord })

  return (
    <div className="space-y-5">
      <Confetti fire={burst} />
      <header className="min-w-0">
        <h1 className="text-[22px] font-bold tracking-[-0.4px]">{formatDateHeading(selected, lang)}</h1>
        <p className="mt-1 text-[13px] text-ink-muted">{t('home.summary', { name, date: dateWord, total: todos.selectedStats.total, done: todos.selectedStats.done })}</p>
      </header>

      {todos.overdue.length > 0 && (
        <div className="flex items-center gap-2 rounded-card border border-line-strong px-4 py-2 text-sm">
          <span className="flex-1">{t('home.overdue', { count: todos.overdue.length })}</span>
          <Button size="sm" variant="secondary" onClick={() => void todos.moveOverdueToToday()}>{t('home.moveToToday')}</Button>
        </div>
      )}

      <WeekStrip selected={selected} onSelect={setSelected} />

      <div className="grid gap-6 md:grid-cols-[1.25fr_0.75fr]">
        <CategoryTodos
          groups={groups}
          categories={categories}
          selected={selected}
          isToday={isToday}
          stats={todos.selectedStats}
          onToggle={(id) => void todos.toggle(id)}
          onAdd={(title, categoryId) => todos.add(title, { categoryId })}
          onUpdate={(id, patch) => void todos.update(id, patch)}
          onRemove={(id) => void todos.remove(id)}
          onManage={() => setManage(true)}
        />
        <div className="divide-y divide-line">
          <CompletionStat stats={todos.selectedStats} title={completionTitle} />
          <TodaySchedule items={schedule.onDate(today)} />
          <DeadlineList schools={schools} today={today} />
        </div>
      </div>

      <CategoryManager open={manage} onClose={() => setManage(false)} />
    </div>
  )
}
