import type { DocumentData } from 'firebase/firestore'
import { SHADE_CLASS, textShade } from '../../lib/theme'
import { isBetween, weekdayOf } from '../../lib/dates'
import type { ScheduleItem, ScheduleKind, Shade } from '../../lib/types'

export type { ScheduleItem, ScheduleKind }

export const KINDS: ScheduleKind[] = ['class', 'research', 'work', 'other']

/** Theme shade per kind (shared by timetable blocks and the home schedule list). */
export const KIND_SHADE: Record<ScheduleKind, Shade> = { class: 2, research: 4, work: 1, other: 5 }

/** Tailwind classes per kind: block background (shade), text that sits on it, left border (lifted text shade). */
export const KIND_STYLE: Record<ScheduleKind, { bg: string; text: string; border: string }> = Object.fromEntries(
  KINDS.map((k) => { const s = KIND_SHADE[k]; return [k, { bg: SHADE_CLASS[s].fill, text: SHADE_CLASS[s].on, border: SHADE_CLASS[textShade(s)].border }] }),
) as Record<ScheduleKind, { bg: string; text: string; border: string }>

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Returns i18n keys of the problems; empty array means valid. */
export function validateScheduleItem(item: Omit<ScheduleItem, 'id'>): string[] {
  const errors: string[] = []
  if (!item.title.trim()) errors.push('timetable.errNoTitle')
  if (toMinutes(item.end) <= toMinutes(item.start)) errors.push('timetable.errEndBeforeStart')
  if (item.repeat === 'weekly' && item.days.length === 0) errors.push('timetable.errNoDays')
  if (item.repeat === 'once' && !item.date) errors.push('timetable.errNoDate')
  return errors
}

/** weekly: weekday matches and from <= iso <= to; once: date === iso. Sorted by start time. */
export function itemsOnDate(items: ScheduleItem[], iso: string): ScheduleItem[] {
  const wd = weekdayOf(iso)
  return items
    .filter((it) => (it.repeat === 'weekly' ? it.days.includes(wd) && isBetween(iso, it.from, it.to) : it.date === iso))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end))
}

export function normalizeScheduleItem(raw: DocumentData, id: string): ScheduleItem {
  return {
    id,
    title: String(raw.title ?? ''),
    kind: KINDS.includes(raw.kind) ? raw.kind : 'other',
    days: Array.isArray(raw.days) ? raw.days.map(Number).filter((d: number) => d >= 1 && d <= 7) : [],
    start: String(raw.start ?? '09:00'),
    end: String(raw.end ?? '10:00'),
    place: String(raw.place ?? ''),
    repeat: raw.repeat === 'once' ? 'once' : 'weekly',
    date: raw.date ? String(raw.date) : null,
    from: String(raw.from ?? ''),
    to: String(raw.to ?? ''),
  }
}
