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
