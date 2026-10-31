import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Course } from './types'
import { parseTermGrades } from './parsers/parseTermGrades'
import { parseCourseGrades } from './parsers/parseCourseGrades'
import { assignTerms } from './parsers/assignTerms'
import {
  DEFAULT_SCALE4, applyRetakeRule, activeCourses, gpaOf, majorGpa, gpa100, scale4,
  earnedCredits, gradProgress, termStats, requiredAverage, projectedGpa,
} from './gpa'

const termsText = readFileSync(join(__dirname, 'parsers/__fixtures__/portal-terms.txt'), 'utf8')
const coursesText = readFileSync(join(__dirname, 'parsers/__fixtures__/portal-courses.txt'), 'utf8')

const terms = parseTermGrades(termsText)
const all: Course[] = assignTerms(terms, parseCourseGrades(coursesText)).assigned.map((c, i) => ({
  ...c, id: String(i), source: 'portal', supersededBy: null,
}))

describe('gpa', () => {
  test('termStats matches the portal term summary', () => {
    expect(termStats(all, '2024-1')).toEqual({ gpa: 4.32, credits: 17, points: 73.5 })
  })
  test('cumulative gpa over all courses', () => {
    expect(gpaOf(all)).toEqual({ gpa: 4.21, credits: 77, points: 324 })
  })
  test('gpa is null with no graded courses', () => {
    expect(gpaOf([]).gpa).toBeNull()
  })
  test('earned credits include pass/fail courses', () => {
    expect(earnedCredits(all)).toBe(91)
  })
  test('major gpa covers 전공필수/전공선택 only', () => {
    expect(majorGpa(all, ['전공필수', '전공선택'])).toEqual({ gpa: 4, credits: 30, points: 120 })
  })
  test('gpa100 conversion', () => {
    expect(gpa100(4.32)).toBe(98.2)
    expect(gpa100(4)).toBe(95)
  })
  test('scale4 uses the conversion table and skips pass/fail', () => {
    const mini = all.filter((c) => ['STAT201', 'STAT170', 'GEKS007'].includes(c.code)) // A+ 3cr, B+ 3cr, P 1cr
    expect(scale4(mini, DEFAULT_SCALE4)).toBe(3.65)
    expect(scale4([], DEFAULT_SCALE4)).toBeNull()
  })
  test('retake rule supersedes the earlier attempt', () => {
    const retake: Course = { ...all.find((c) => c.code === 'STAT221')!, id: 'new', termCode: '2026-1', grade: 'A+', point: 4.5, score: 100 }
    const ruled = applyRetakeRule([...all, retake])
    const old = ruled.find((c) => c.code === 'STAT221' && c.id !== 'new')!
    expect(old.supersededBy).toBe('new')
    expect(ruled.find((c) => c.id === 'new')!.supersededBy).toBeNull()
    expect(gpaOf(activeCourses(ruled))).toEqual({ gpa: 4.25, credits: 77, points: 327 })
  })
  test('graduation progress buckets', () => {
    expect(gradProgress(all, { total: 130 })).toEqual({ total: { earned: 91, required: 130 } })
  })
  test('required average for a target gpa', () => {
    expect(requiredAverage(324, 77, 4.3, 39)).toBe(4.48)
    expect(requiredAverage(324, 77, 4.3, 0)).toBeNull()
  })
  test('projected gpa with planned grades', () => {
    expect(projectedGpa(324, 77, [{ credits: 3, grade: 'A+' }, { credits: 3, grade: 'B+' }])).toBe(4.19)
  })
})

describe('applyRetakeRule ignores codes that are not real course codes', () => {
  const mk = (id: string, code: string, termCode: string): Course => ({
    id, code, section: '00', name: id, category: '전공선택', area: '', credits: 3, score: null, grade: 'A', point: 4.0,
    termCode, source: 'manual', supersededBy: null, order: 0,
  })
  test('empty codes never supersede each other', () => {
    const out = applyRetakeRule([mk('a', '', '2024-1'), mk('b', '', '2025-1')])
    expect(out.map((c) => c.supersededBy)).toEqual([null, null])
  })
  test('numeric placeholder codes (exchange courses) never supersede each other', () => {
    const out = applyRetakeRule([mk('a', '1', '2025-S'), mk('b', '1', '2026-1')])
    expect(out.map((c) => c.supersededBy)).toEqual([null, null])
  })
  test('real codes still follow the latest-term-wins rule', () => {
    const out = applyRetakeRule([mk('a', 'STAT201', '2024-1'), mk('b', 'STAT201', '2025-1')])
    expect(out.find((c) => c.id === 'a')?.supersededBy).toBe('b')
  })
})
