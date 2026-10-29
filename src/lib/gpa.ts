import type { Course, Grade, TermCode } from './types'
import { termOrder } from './parsers/termCode'

export const GPA_EXCLUDED: Grade[] = ['P', 'S', 'NP', 'U']
export const EARNED_EXCLUDED: Grade[] = ['F', 'NP', 'U']
export const MAJOR_CATEGORIES = ['전공필수', '전공선택']
export const LIBERAL_CATEGORIES = ['교양', '학문의기초']

export const DEFAULT_SCALE4: Record<Grade, number> = {
  'A+': 4.0, A: 3.7, 'B+': 3.3, B: 3.0, 'C+': 2.3, C: 2.0, 'D+': 1.3, D: 1.0, F: 0, P: 0, NP: 0, S: 0, U: 0,
}

export const POINT_OF: Record<Grade, number> = {
  'A+': 4.5, A: 4.0, 'B+': 3.5, B: 3.0, 'C+': 2.5, C: 2.0, 'D+': 1.5, D: 1.0, F: 0, P: 0, NP: 0, S: 0, U: 0,
}

const round2 = (x: number) => Math.round(x * 100) / 100
const round1 = (x: number) => Math.round(x * 10) / 10

export type GpaResult = { gpa: number | null; credits: number; points: number }

/** Same course code taken more than once: the latest term wins, earlier attempts are superseded. */
export function applyRetakeRule(courses: Course[]): Course[] {
  const byCode = new Map<string, Course[]>()
  for (const c of courses) {
    if (!c.termCode) continue
    // manual courses without a code, and exchange courses with numeric placeholder codes, are never retakes
    if (!c.code || /^\d+$/.test(c.code)) continue
    const list = byCode.get(c.code) ?? []
    list.push(c)
    byCode.set(c.code, list)
  }
  const supersededBy = new Map<string, string>()
  for (const list of byCode.values()) {
    if (list.length < 2) continue
    const latest = list.reduce((a, b) => (termOrder(b.termCode!) > termOrder(a.termCode!) ? b : a))
    for (const c of list) if (c.id !== latest.id) supersededBy.set(c.id, latest.id)
  }
  return courses.map((c) => ({ ...c, supersededBy: supersededBy.get(c.id) ?? null }))
}

export function activeCourses(courses: Course[]): Course[] {
  return courses.filter((c) => c.supersededBy == null)
}

export function gpaOf(courses: Course[]): GpaResult {
  let credits = 0
  let points = 0
  for (const c of courses) {
    if (GPA_EXCLUDED.includes(c.grade)) continue
    credits += c.credits
    points += c.point * c.credits
  }
  points = round2(points)
  return { gpa: credits ? round2(points / credits) : null, credits, points }
}

export function majorGpa(courses: Course[]): GpaResult {
  return gpaOf(courses.filter((c) => MAJOR_CATEGORIES.includes(c.category)))
}

export function gpa100(gpa: number): number {
  return round1(100 - (4.5 - gpa) * 10)
}

export function scale4(courses: Course[], table: Record<Grade, number>): number | null {
  let credits = 0
  let points = 0
  for (const c of courses) {
    if (GPA_EXCLUDED.includes(c.grade)) continue
    credits += c.credits
    points += (table[c.grade] ?? 0) * c.credits
  }
  return credits ? round2(points / credits) : null
}

export function earnedCredits(courses: Course[]): number {
  return courses.filter((c) => !EARNED_EXCLUDED.includes(c.grade)).reduce((s, c) => s + c.credits, 0)
}

export function gradProgress(courses: Course[], req: { total: number; major: number; liberal: number }) {
  const earned = courses.filter((c) => !EARNED_EXCLUDED.includes(c.grade))
  const sum = (list: Course[]) => list.reduce((s, c) => s + c.credits, 0)
  return {
    total: { earned: sum(earned), required: req.total },
    major: { earned: sum(earned.filter((c) => MAJOR_CATEGORIES.includes(c.category))), required: req.major },
    liberal: { earned: sum(earned.filter((c) => LIBERAL_CATEGORIES.includes(c.category))), required: req.liberal },
  }
}

export function termStats(courses: Course[], termCode: TermCode): GpaResult {
  return gpaOf(courses.filter((c) => c.termCode === termCode))
}

export function requiredAverage(points: number, credits: number, targetGpa: number, remainingCredits: number): number | null {
  if (remainingCredits <= 0) return null
  return round2((targetGpa * (credits + remainingCredits) - points) / remainingCredits)
}

export function projectedGpa(points: number, credits: number, planned: { credits: number; grade: Grade }[]): number | null {
  let p = points
  let c = credits
  for (const x of planned) {
    if (GPA_EXCLUDED.includes(x.grade)) continue
    p += POINT_OF[x.grade] * x.credits
    c += x.credits
  }
  return c ? round2(p / c) : null
}
