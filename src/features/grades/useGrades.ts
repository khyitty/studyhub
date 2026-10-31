import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { DocumentData } from 'firebase/firestore'
import { useUserCollection } from '../../data/useUserCollection'
import { useProfile } from '../../data/useProfile'
import { activeCourses, applyRetakeRule, gpaOf, gradProgress, majorGpa, scale4, POINT_OF } from '../../lib/gpa'
import { mergeImport } from '../../lib/mergeImport'
import { parseTermGrades } from '../../lib/parsers/parseTermGrades'
import { parseCourseGrades } from '../../lib/parsers/parseCourseGrades'
import { assignTerms } from '../../lib/parsers/assignTerms'
import type { Course, Grade, Term } from '../../lib/types'
import { gridRows, majorNames, seedCatsFromCourses, shouldSeedCreditCats } from '../../lib/creditCats'
import { useCreditCats } from './useCreditCats'

export type TermDoc = Term & { id: string }

const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function normalizeTerm(raw: DocumentData, id: string): TermDoc {
  return {
    id,
    code: String(raw.code ?? ''),
    label: String(raw.label ?? ''),
    order: Number(raw.order ?? 0),
    requested: numOrNull(raw.requested),
    earned: numOrNull(raw.earned),
    totalPoints: numOrNull(raw.totalPoints),
    gpaCert: numOrNull(raw.gpaCert),
    gpa: numOrNull(raw.gpa),
    gpa100: numOrNull(raw.gpa100),
  }
}

export function normalizeCourse(raw: DocumentData, id: string): Course {
  const grade = (raw.grade ?? 'P') as Grade
  return {
    id,
    code: String(raw.code ?? ''),
    section: String(raw.section ?? ''),
    name: String(raw.name ?? ''),
    category: String(raw.category ?? ''),
    area: String(raw.area ?? ''),
    credits: Number(raw.credits ?? 0),
    score: numOrNull(raw.score),
    grade,
    point: typeof raw.point === 'number' ? raw.point : (POINT_OF[grade] ?? 0),
    termCode: raw.termCode ? String(raw.termCode) : null,
    source: raw.source === 'portal' ? 'portal' : 'manual',
    supersededBy: null,
    order: Number(raw.order ?? 0),
  }
}

export type NewCourse = Omit<Course, 'id' | 'source' | 'supersededBy' | 'order'>

/** Dry run of a portal import: what would be written, plus warnings. */
export function previewImport(termsText: string, coursesText: string) {
  const terms = parseTermGrades(termsText)
  const parsed = parseCourseGrades(coursesText)
  const { assigned, warnings } = assignTerms(terms, parsed)
  return { terms, assigned, warnings }
}

export function useGrades() {
  const { profile, update: updateProfile, loading: profileLoading } = useProfile()
  const creditCats = useCreditCats()
  const termsCol = useUserCollection<TermDoc>('terms', normalizeTerm)
  const coursesCol = useUserCollection<Course>('courses', normalizeCourse)

  const terms = useMemo(() => [...termsCol.items].sort((a, b) => a.order - b.order), [termsCol.items])
  const courses = useMemo(() => applyRetakeRule(coursesCol.items), [coursesCol.items])
  const active = useMemo(() => activeCourses(courses), [courses])
  const cumulative = useMemo(() => gpaOf(active), [active])
  const cats = creditCats.cats
  const major = useMemo(() => majorGpa(active, majorNames(cats)), [active, cats])
  const s4 = useMemo(() => scale4(active, profile.gpa4Scale), [active, profile.gpa4Scale])
  const progress = useMemo(() => gradProgress(active, { total: profile.gradReq.total }), [active, profile.gradReq.total])
  const rows = useMemo(() => gridRows(cats, courses), [cats, courses])
  const firstYear = terms.length ? Number(terms[0].code.slice(0, 4)) : null

  // one-time seed of the credit rows: from the user's existing courses, or the four defaults
  const seeded = useRef(false)
  const { put: putCat } = creditCats
  useEffect(() => {
    if (seeded.current) return
    if (!shouldSeedCreditCats(profile, cats, creditCats.loading, coursesCol.loading, profileLoading)) return
    seeded.current = true
    void Promise.all(seedCatsFromCourses(coursesCol.items, terms).map(putCat)).then(() => updateProfile({ creditCatsSeeded: true }))
  }, [profile, cats, creditCats.loading, coursesCol.loading, profileLoading, coursesCol.items, terms, putCat, updateProfile])

  const importPortal = useCallback(async (termsText: string, coursesText: string) => {
    const { terms: newTerms, assigned, warnings } = previewImport(termsText, coursesText)
    const { toWrite, deleteIds } = mergeImport(coursesCol.items, assigned)
    await termsCol.setMany(newTerms, { deleteIds: termsCol.items.map((t) => t.id) })
    await coursesCol.setMany(toWrite, { deleteIds })
    return { warnings, termCount: newTerms.length, courseCount: toWrite.length }
  }, [termsCol, coursesCol])

  const addCourse = useCallback((c: NewCourse) => coursesCol.add({ ...c, source: 'manual', supersededBy: null, order: Date.now() }), [coursesCol])
  const updateCourse = useCallback((id: string, patch: Partial<NewCourse>) => coursesCol.update(id, patch), [coursesCol])
  const removeCourse = useCallback((id: string) => coursesCol.remove(id), [coursesCol])

  return {
    terms, courses, active, cumulative, major, scale4: s4, progress,
    importPortal, addCourse, updateCourse, removeCourse,
    cats, rows, firstYear,
    addCat: creditCats.add, renameCat: creditCats.rename, updateCat: creditCats.update, removeCat: creditCats.remove, moveCat: creditCats.move,
    loading: termsCol.loading || coursesCol.loading,
  }
}

export type Grades = ReturnType<typeof useGrades>
