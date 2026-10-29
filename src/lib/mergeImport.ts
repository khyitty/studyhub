import type { Course, ParsedCourse, TermCode } from './types'

/**
 * A portal import replaces both collections, so saving with one side empty would wipe the other.
 * Returns i18n keys of the problems; empty array means the preview may be saved.
 */
export function importProblems(preview: { terms: unknown[]; assigned: unknown[] }): string[] {
  const problems: string[] = []
  if (preview.terms.length === 0) problems.push('grades.errNoTerms')
  if (preview.assigned.length === 0) problems.push('grades.errNoCourses')
  return problems
}

/**
 * Re-importing from the portal replaces every portal-sourced course and keeps manual ones.
 * Retake links are recomputed on read (applyRetakeRule), so supersededBy is written as null.
 */
export function mergeImport(
  existingCourses: Course[],
  parsed: (ParsedCourse & { termCode: TermCode | null })[],
): { toWrite: Omit<Course, 'id'>[]; deleteIds: string[] } {
  const deleteIds = existingCourses.filter((c) => c.source === 'portal').map((c) => c.id)
  const toWrite = parsed.map((p, i) => ({ ...p, source: 'portal' as const, supersededBy: null, order: i }))
  return { toWrite, deleteIds }
}
