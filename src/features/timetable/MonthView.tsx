import { useMemo, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'
import { useLang, useT } from '../../i18n/useT'
import { addDays, fromISO, startOfWeek, toISO, todayISO } from '../../lib/dates'
import { KIND_STYLE, itemsOnDate, type ScheduleItem } from './schedule'

type Props = { items: ScheduleItem[]; selected: string; onSelect: (iso: string) => void; onPick: (item: ScheduleItem) => void }

export function MonthView({ items, selected, onSelect, onPick }: Props) {
  const t = useT()
  const lang = useLang()
  const today = todayISO()
  const [month, setMonth] = useState(() => selected.slice(0, 7)) // 'YYYY-MM'
  const dayNames = t('timetable.dayNames').split(',')

  const cells = useMemo(() => {
    const first = `${month}-01`
    const start = startOfWeek(first)
    const out: string[] = []
    for (let i = 0; i < 42; i++) out.push(addDays(start, i))
    // drop a trailing empty week
    return out.slice(5 * 7).every((iso) => !iso.startsWith(month)) ? out.slice(0, 35) : out
  }, [month])

  const shift = (n: number) => {
    const d = fromISO(`${month}-01`)
    d.setMonth(d.getMonth() + n)
    setMonth(toISO(d).slice(0, 7))
  }
  const title = fromISO(`${month}-01`).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long' })
  const dayItems = itemsOnDate(items, selected)

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" aria-label={t('common.prev')} onClick={() => shift(-1)} className="flex h-11 w-11 items-center justify-center rounded-pill hover:bg-surface-2"><IconChevronLeft /></button>
        <button type="button" onClick={() => { setMonth(today.slice(0, 7)); onSelect(today) }} className="min-h-11 flex-1 rounded-pill bg-surface-2 px-3 text-sm font-semibold">{title}</button>
        <button type="button" aria-label={t('common.next')} onClick={() => shift(1)} className="flex h-11 w-11 items-center justify-center rounded-pill hover:bg-surface-2"><IconChevronRight /></button>
      </div>

      <div className="rounded-card bg-surface p-2 shadow-soft">
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-ink-muted">
          {[1, 2, 3, 4, 5, 6, 7].map((wd) => <div key={wd} className="py-1">{dayNames[wd % 7]}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((iso) => {
            const inMonth = iso.startsWith(month)
            const once = items.filter((it) => it.repeat === 'once' && it.date === iso)
            const isSel = iso === selected
            return (
              <button key={iso} type="button" onClick={() => onSelect(iso)} aria-pressed={isSel} aria-label={iso}
                className={`flex min-h-11 flex-col items-center justify-start rounded-xl py-1 text-sm ${inMonth ? '' : 'opacity-35'} ${isSel ? 'bg-peach' : 'hover:bg-surface-2'}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${iso === today ? 'bg-peach-deep font-bold text-white' : ''}`}>{Number(iso.slice(8, 10))}</span>
                <span className="mt-0.5 flex h-2 gap-0.5">
                  {once.slice(0, 3).map((it) => <span key={it.id} className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE[it.kind].dot}`} />)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="mb-2 text-sm font-bold text-ink-muted">{fromISO(selected).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', weekday: 'short' })}</h2>
        {dayItems.length === 0 ? (
          <p className="rounded-card bg-surface-2 px-4 py-6 text-center text-sm text-ink-muted">{t('timetable.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {dayItems.map((it) => {
              const st = KIND_STYLE[it.kind]
              return (
                <li key={it.id}>
                  <button type="button" onClick={() => onPick(it)} className="flex w-full items-center gap-3 rounded-card bg-surface px-4 py-3 text-left shadow-soft">
                    <span className={`h-10 w-1.5 shrink-0 rounded-pill ${st.dot}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{it.title}</span>
                      <span className="block text-xs text-ink-muted">{it.start}–{it.end}{it.place ? ` · ${it.place}` : ''}</span>
                    </span>
                    <span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${st.bg} ${st.text}`}>{t(`timetable.${it.kind}`)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
