import type { ParsedCourse, Term, TermCode } from '../types'

export type AssignedCourse = ParsedCourse & { termCode: TermCode | null }

/**
 * Courses come out of the portal in term order. Walk the terms in order and
 * pour courses into each one until its requested credit total is reached.
 */
export function assignTerms(terms: Term[], courses: ParsedCourse[]): { assigned: AssignedCourse[]; warnings: string[] } {
  const assigned: AssignedCourse[] = []
  const warnings: string[] = []
  const sorted = [...terms].sort((a, b) => a.order - b.order)
  let idx = 0
  for (const term of sorted) {
    const target = term.requested ?? term.earned
    if (!target) continue
    let sum = 0
    while (sum < target) {
      if (idx >= courses.length) {
        if (sum > 0) warnings.push(`${term.code}: credits ${sum}/${target} — ran out of courses`)
        break
      }
      const c = courses[idx++]
      assigned.push({ ...c, termCode: term.code })
      sum += c.credits
    }
    if (sum > target) warnings.push(`${term.code}: credits ${sum}/${target} — overshoot, check assignment`)
  }
  if (idx < courses.length) {
    const left = courses.length - idx
    warnings.push(`${left} course(s) left unassigned`)
    for (; idx < courses.length; idx++) assigned.push({ ...courses[idx], termCode: null })
  }
  return { assigned, warnings }
}
