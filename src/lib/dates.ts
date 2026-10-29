const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 'YYYY-MM-DD' → local Date at midnight */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Local 'YYYY-MM-DD' for today. */
export function todayISO(): string {
  return toISO(new Date())
}

/** Mon=1 … Sun=7 */
export function weekdayOf(iso: string): number {
  const day = fromISO(iso).getDay()
  return day === 0 ? 7 : day
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** The Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  return addDays(iso, 1 - weekdayOf(iso))
}

/** Inclusive on both ends; ISO strings compare lexicographically. */
export function isBetween(iso: string, from: string, to: string): boolean {
  return iso >= from && iso <= to
}

export function nowISOTime(): string {
  return new Date().toISOString()
}

/** The 7 ISO dates Mon..Sun starting at `weekStart` (a Monday). */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** ko: "10월 29일 목요일", en: "Thursday, October 29" */
export function formatDateHeading(iso: string, lang: 'ko' | 'en'): string {
  return fromISO(iso).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', weekday: 'long' })
}

/** "10/5" */
export function formatShortDate(iso: string): string {
  const d = fromISO(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
