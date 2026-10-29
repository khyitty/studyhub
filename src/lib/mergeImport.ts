import type { Course, ParsedCourse, TermCode } from './types'

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
