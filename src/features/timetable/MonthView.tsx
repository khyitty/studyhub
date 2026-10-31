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
  const nav = 'flex h-10 w-10 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2'

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" aria-label={t('common.prev')} onClick={() => shift(-1)} className={nav}><IconChevronLeft size={18} /></button>
        <button type="button" onClick={() => { setMonth(today.slice(0, 7)); onSelect(today) }} className="min-h-10 flex-1 rounded-card border border-line-strong bg-surface px-3 text-sm font-semibold hover:bg-surface-2">{title}</button>
        <button type="button" aria-label={t('common.next')} onClick={() => shift(1)} className={nav}><IconChevronRight size={18} /></button>
      </div>

      <div className="rounded-card border border-line-strong bg-surface">
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-ink-muted">
          {[1, 2, 3, 4, 5, 6, 7].map((wd) => <div key={wd} className="py-1.5">{dayNames[wd % 7]}</div>)}
        </div>
        <div className="grid grid-cols-7 border-t border-line">
          {cells.map((iso, i) => {
            const inMonth = iso.startsWith(month)
            const once = items.filter((it) => it.repeat === 'once' && it.date === iso)
            const isSel = iso === selected
            return (
              <button key={iso} type="button" onClick={() => onSelect(iso)} aria-pressed={isSel} aria-label={iso}
                className={`flex min-h-12 flex-col items-center justify-start border-line py-1 text-sm ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} ${inMonth ? '' : 'text-ink-faint'} ${isSel ? 'bg-surface-2' : 'hover:bg-surface-2/60'}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-card tabular-nums ${iso === today ? 'bg-primary font-bold text-on-primary' : ''}`}>{Number(iso.slice(8, 10))}</span>
                <span className="mt-0.5 flex h-2 gap-0.5">
                  {once.slice(0, 3).map((it) => <span key={it.id} className={`h-1.5 w-1.5 rounded-[1px] ${KIND_STYLE[it.kind].bg}`} />)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-bold">{fromISO(selected).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', weekday: 'short' })}</h2>
        {dayItems.length === 0 ? (
          <p className="py-3 text-[13px] text-ink-muted">{t('timetable.empty')}</p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {dayItems.map((it) => {
              const st = KIND_STYLE[it.kind]
              return (
                <li key={it.id}>
                  <button type="button" onClick={() => onPick(it)} className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-[13px] hover:bg-surface-2/60">
                    <span className="w-11 shrink-0 text-xs text-ink-muted tabular-nums">{it.start}</span>
                    <span className={`h-[26px] w-[3px] shrink-0 ${st.bg}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{it.title}</span>
                      <span className="block text-[11px] text-ink-muted">{it.start}–{it.end}{it.place ? ` · ${it.place}` : ''}</span>
                    </span>
                    <span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${st.text} ${st.bg}`}>{t(`timetable.${it.kind}`)}</span>
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
