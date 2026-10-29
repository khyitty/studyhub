import type { DocumentData } from 'firebase/firestore'
import { fromISO } from './dates'
import type { GreReq, PaletteColor, School, SchoolStatus, SopState } from './types'

export const SCHOOL_STATUSES: SchoolStatus[] = ['interested', 'preparing', 'submitted', 'accepted', 'rejected']
const GRE_REQS: GreReq[] = ['required', 'optional', 'none']
const SOP_STATES: SopState[] = ['none', 'todo', 'draft', 'done']

export const STATUS_COLOR: Record<SchoolStatus, PaletteColor | null> = {
  interested: null,
  preparing: 'butter',
  submitted: 'mint',
  accepted: 'sky',
  rejected: null,
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

export function normalizeSchool(raw: DocumentData, id: string): School {
  const toefl = raw.toeflMin
  return {
    id,
    name: String(raw.name ?? ''),
    program: String(raw.program ?? ''),
    deadline: String(raw.deadline ?? ''),
    gre: GRE_REQS.includes(raw.gre) ? raw.gre : 'none',
    toeflMin: typeof toefl === 'number' && Number.isFinite(toefl) ? toefl : null,
    recsRequired: num(raw.recsRequired, 3),
    recsDone: num(raw.recsDone, 0),
    sop: SOP_STATES.includes(raw.sop) ? raw.sop : 'todo',
    fee: String(raw.fee ?? ''),
    status: SCHOOL_STATUSES.includes(raw.status) ? raw.status : 'interested',
    notes: String(raw.notes ?? ''),
    links: Array.isArray(raw.links) ? raw.links.map((l: DocumentData) => ({ title: String(l?.title ?? ''), url: String(l?.url ?? '') })) : [],
    professors: Array.isArray(raw.professors) ? raw.professors.map((p: DocumentData) => ({ name: String(p?.name ?? ''), note: String(p?.note ?? '') })) : [],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  }
}

/** Days from `today` to `deadline`; negative = past. */
export function dday(deadline: string, today: string): number {
  return Math.round((fromISO(deadline).getTime() - fromISO(today).getTime()) / 86400000)
}

/** 0 → 'D-day', 5 → 'D-5', -2 → 'D+2' */
export function ddayLabel(n: number): string {
  if (n === 0) return 'D-day'
  return n > 0 ? `D-${n}` : `D+${-n}`
}

export function toeflStatus(min: number | null, mine: number | null): 'ok' | 'short' | 'unknown' {
  if (min == null || mine == null) return 'unknown'
  return mine >= min ? 'ok' : 'short'
}

export function recsStatus(done: number, required: number): 'ok' | 'warn' {
  return done >= required ? 'ok' : 'warn'
}

export type SortKey = 'deadline' | 'name' | 'status'

function byDeadline(today: string) {
  return (a: School, b: School) => {
    const da = dday(a.deadline, today)
    const db = dday(b.deadline, today)
    const pa = da < 0, pb = db < 0
    if (pa !== pb) return pa ? 1 : -1 // upcoming first
    return pa ? db - da : da - db // past: most recently passed first
  }
}

/** deadline: upcoming by D-day asc, then past (most recent first). name: localeCompare. status: SCHOOL_STATUSES order, ties by deadline. */
export function sortSchools(list: School[], key: SortKey, today: string): School[] {
  const dl = byDeadline(today)
  const cmp: Record<SortKey, (a: School, b: School) => number> = {
    deadline: dl,
    name: (a, b) => a.name.localeCompare(b.name) || dl(a, b),
    status: (a, b) => SCHOOL_STATUSES.indexOf(a.status) - SCHOOL_STATUSES.indexOf(b.status) || dl(a, b),
  }
  return [...list].sort(cmp[key])
}

export type StatusFilter = 'all' | SchoolStatus | 'result'

export function filterSchools(list: School[], f: StatusFilter): School[] {
  if (f === 'all') return list
  if (f === 'result') return list.filter((s) => s.status === 'accepted' || s.status === 'rejected')
  return list.filter((s) => s.status === f)
}

/** Upcoming deadlines (D-day >= 0) of schools still being worked on, nearest first, at most n. */
export function nearestDeadlines(list: School[], today: string, n = 3): School[] {
  return list
    .filter((s) => (s.status === 'interested' || s.status === 'preparing') && s.deadline && dday(s.deadline, today) >= 0)
    .sort((a, b) => dday(a.deadline, today) - dday(b.deadline, today))
    .slice(0, n)
}
