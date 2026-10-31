import { useMemo, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { addDays, startOfWeek, todayISO } from '../../lib/dates'
import { kindOf, kindStyle, type Kind } from '../../lib/kinds'
import { itemsOnDate, toMinutes, type ScheduleItem } from './schedule'

const HOUR_PX = 44

type Placed = { item: ScheduleItem; lane: number; lanes: number }

/** Assign overlapping items to side-by-side lanes. Items are pre-sorted by start. */
function placeLanes(items: ScheduleItem[]): Placed[] {
  const placed: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1
  const flush = () => { const n = Math.max(1, ...cluster.map((p) => p.lane + 1)); cluster.forEach((p) => { p.lanes = n }); cluster = [] }
  for (const item of items) {
    const s = toMinutes(item.start)
    const e = toMinutes(item.end)
    if (s >= clusterEnd) { flush(); clusterEnd = e } else clusterEnd = Math.max(clusterEnd, e)
    const used = new Set(cluster.filter((p) => toMinutes(p.item.end) > s).map((p) => p.lane))
    let lane = 0
    while (used.has(lane)) lane++
    const p = { item, lane, lanes: 1 }
    cluster.push(p)
    placed.push(p)
  }
  flush()
  return placed
}

type Props = { items: ScheduleItem[]; kinds: Kind[]; onPick: (item: ScheduleItem) => void }

export function WeekView({ items, kinds, onPick }: Props) {
  const t = useT()
  const today = todayISO()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [weekend, setWeekend] = useState(false)
  const dayNames = t('timetable.dayNames').split(',')
  const days = useMemo(() => Array.from({ length: weekend ? 7 : 5 }, (_, i) => addDays(weekStart, i)), [weekStart, weekend])
  const perDay = useMemo(() => days.map((iso) => placeLanes(itemsOnDate(items, iso))), [days, items])

  const all = perDay.flat().map((p) => p.item)
  const minHour = Math.min(9, ...all.map((it) => Math.floor(toMinutes(it.start) / 60)))
  const maxHour = Math.max(21, ...all.map((it) => Math.ceil(toMinutes(it.end) / 60)))
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i)
  const height = hours.length * HOUR_PX
  const fmt = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`
  const nav = 'flex h-10 w-10 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2'

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" aria-label={t('common.prev')} onClick={() => setWeekStart(addDays(weekStart, -7))} className={nav}><IconChevronLeft size={18} /></button>
        <button type="button" onClick={() => setWeekStart(startOfWeek(today))} className="min-h-10 flex-1 rounded-card border border-line-strong bg-surface px-3 text-sm font-semibold hover:bg-surface-2">
          {fmt(days[0])} – {fmt(days[days.length - 1])}{weekStart === startOfWeek(today) ? ` · ${t('timetable.thisWeek')}` : ''}
        </button>
        <button type="button" aria-label={t('common.next')} onClick={() => setWeekStart(addDays(weekStart, 7))} className={nav}><IconChevronRight size={18} /></button>
        <button type="button" aria-pressed={weekend} onClick={() => setWeekend(!weekend)}
          className={`min-h-10 rounded-card border px-3 text-sm font-semibold ${weekend ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-ink-muted hover:text-ink'}`}>{t('timetable.weekend')}</button>
      </div>

      <div className="overflow-hidden rounded-card border border-line-strong bg-surface">
        <div className="grid" style={{ gridTemplateColumns: `2.25rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <div />
          {days.map((iso, i) => (
            <div key={iso} className={`py-2 text-center text-xs font-semibold ${iso === today ? 'bg-surface-2/60 text-ink' : 'text-ink-muted'}`}>
              <div>{dayNames[(i + 1) % 7]}</div>
              <div className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-card tabular-nums ${iso === today ? 'bg-primary text-on-primary' : ''}`}>{Number(iso.slice(8, 10))}</div>
            </div>
          ))}
        </div>
        <div className="grid border-t border-line" style={{ gridTemplateColumns: `2.25rem repeat(${days.length}, minmax(0, 1fr))`, height }}>
          <div className="relative">
            {hours.map((h, i) => <span key={h} className="absolute right-1 text-[10px] text-ink-muted tabular-nums" style={{ top: i * HOUR_PX - 6 }}>{h}</span>)}
          </div>
          {perDay.map((placed, di) => (
            <div key={days[di]} className={`relative border-l border-line ${days[di] === today ? 'bg-surface-2/60' : ''}`}>
              {hours.map((h, i) => <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * HOUR_PX }} />)}
              {placed.map(({ item, lane, lanes }) => {
                const top = ((toMinutes(item.start) - minHour * 60) / 60) * HOUR_PX
                const h = ((toMinutes(item.end) - toMinutes(item.start)) / 60) * HOUR_PX
                const st = kindStyle(kindOf(kinds, item.kind))
                return (
                  <button key={item.id} type="button" onClick={() => onPick(item)}
                    className={`absolute overflow-hidden rounded-card border-l-[3px] px-1.5 py-0.5 text-left text-[11px] leading-tight ${st.text} ${st.border} ${st.bg}`}
                    style={{ top: top + 1, height: Math.max(h - 2, 18), left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                    title={`${item.title} ${item.start}–${item.end}`}>
                    <span className="block truncate font-bold">{item.title}</span>
                    {h >= 36 && <span className="block truncate opacity-70">{item.place || `${item.start}–${item.end}`}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
