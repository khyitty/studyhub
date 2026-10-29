import { useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'
import { useLang, useT } from '../../i18n/useT'
import { addDays, fromISO, startOfWeek, todayISO, weekDays } from '../../lib/dates'

const KO = ['월', '화', '수', '목', '금', '토', '일']
const EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function WeekStrip({ selected, onSelect }: { selected: string; onSelect: (iso: string) => void }) {
  const t = useT()
  const lang = useLang()
  const today = todayISO()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(selected))
  const days = weekDays(weekStart)
  const todayVisible = days.includes(today)
  const names = lang === 'ko' ? KO : EN

  const nav = 'flex h-9 w-9 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2'

  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label={t('home.prevWeek')} className={nav} onClick={() => setWeekStart(addDays(weekStart, -7))}><IconChevronLeft size={16} /></button>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map((iso, i) => {
          const isToday = iso === today
          const isSel = iso === selected
          const weekend = i >= 5
          const cls = isToday
            ? 'bg-primary text-on-primary'
            : isSel ? 'border border-ink text-ink' : weekend ? 'text-ink-faint hover:bg-surface-2' : 'text-ink hover:bg-surface-2'
          return (
            <button key={iso} type="button" aria-pressed={isSel} aria-label={iso}
              onClick={() => onSelect(iso)}
              className={`flex min-h-11 flex-col items-center justify-center rounded-card text-sm font-semibold tabular-nums transition ${cls}`}>
              <span className={`text-[10px] font-medium ${isToday ? 'opacity-80' : 'text-ink-muted'}`}>{names[i]}</span>
              <span>{fromISO(iso).getDate()}</span>
            </button>
          )
        })}
      </div>
      <button type="button" aria-label={t('home.nextWeek')} className={nav} onClick={() => setWeekStart(addDays(weekStart, 7))}><IconChevronRight size={16} /></button>
      {!todayVisible && (
        <button type="button" onClick={() => { setWeekStart(startOfWeek(today)); onSelect(today) }}
          className="ml-1 min-h-9 rounded-card border border-line-strong px-2.5 text-xs font-semibold text-ink hover:bg-surface-2">
          {t('home.backToToday')}
        </button>
      )}
    </div>
  )
}
