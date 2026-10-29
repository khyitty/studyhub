import type { DocumentData } from 'firebase/firestore'
import { isBetween, weekdayOf } from '../../lib/dates'
import type { PaletteColor, ScheduleItem, ScheduleKind } from '../../lib/types'

export type { ScheduleItem, ScheduleKind }

export const KINDS: ScheduleKind[] = ['class', 'research', 'work', 'other']

/** Pastel color per kind (shared by timetable blocks and the home schedule list). */
export const KIND_COLOR: Record<ScheduleKind, PaletteColor> = { class: 'sky', research: 'mint', work: 'butter', other: 'lilac' }

/** Tailwind classes per kind: block background + text. */
export const KIND_STYLE: Record<ScheduleKind, { bg: string; text: string; dot: string }> = {
  class: { bg: 'bg-peach', text: 'text-peach-deep', dot: 'bg-peach-deep' },
  research: { bg: 'bg-lilac', text: 'text-lilac-deep', dot: 'bg-lilac-deep' },
  work: { bg: 'bg-mint', text: 'text-mint-deep', dot: 'bg-mint-deep' },
  other: { bg: 'bg-butter', text: 'text-butter-deep', dot: 'bg-butter-deep' },
}

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
