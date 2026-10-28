import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { termCodeFromLabel, termOrder } from './termCode'
import { parseTermGrades } from './parseTermGrades'
import { parseCourseGrades } from './parseCourseGrades'
import { assignTerms } from './assignTerms'

const termsText = readFileSync(join(__dirname, '__fixtures__/portal-terms.txt'), 'utf8')
const coursesText = readFileSync(join(__dirname, '__fixtures__/portal-courses.txt'), 'utf8')

describe('termCode', () => {
  test('maps portal labels to codes', () => {
    expect(termCodeFromLabel('2024학년도 1학기')).toBe('2024-1')
    expect(termCodeFromLabel('2024학년도 계절수업(여름)')).toBe('2024-S')
    expect(termCodeFromLabel('2024학년도 2학기')).toBe('2024-2')
    expect(termCodeFromLabel('2024학년도 계절수업(겨울)')).toBe('2024-W')
  })
  test('orders terms chronologically', () => {
    expect(termOrder('2024-W')).toBe(20244)
    expect(termOrder('2024-1')).toBeLessThan(termOrder('2024-S'))
    expect(termOrder('2024-S')).toBeLessThan(termOrder('2024-2'))
  })
})

describe('parseTermGrades', () => {
  test('parses all seven terms from fixture', () => {
    const terms = parseTermGrades(termsText)
    expect(terms).toHaveLength(7)
    expect(terms[0]).toEqual({
      code: '2024-1', label: '2024학년도 1학기', order: 20241,
      requested: 18, earned: 18, totalPoints: 73.5, gpaCert: 4.32, gpa: 4.32, gpa100: 98.2,
    })
    expect(terms[6].code).toBe('2026-1')
    expect(terms[6].gpa).toBe(0)
  })
  test('fills missing trailing cells with null', () => {
    const terms = parseTermGrades('2025학년도 1학기\n15\n15\n60\n4')
    expect(terms[0].requested).toBe(15)
    expect(terms[0].gpaCert).toBe(4)
    expect(terms[0].gpa).toBeNull()
    expect(terms[0].gpa100).toBeNull()
  })
})

describe('parseCourseGrades', () => {
  const courses = parseCourseGrades(coursesText)
  test('parses all 32 courses', () => {
    expect(courses).toHaveLength(32)
  })
  test('parses a full-width row', () => {
    expect(courses[0]).toEqual({
      code: 'GEBT001', section: '04', name: '[진로·창업] 생명과학의 세계', category: '교양', area: '교양 필수',
      credits: 3, score: 100, grade: 'A+', point: 4.5,
    })
  })
  test('parses a row with no area', () => {
    expect(courses[5].code).toBe('STAT201')
    expect(courses[5].area).toBe('')
    expect(courses[5].score).toBe(100)
  })
  test('parses a pass/fail row', () => {
    expect(courses[2].grade).toBe('P')
    expect(courses[2].point).toBe(0)
  })
  test('parses an exchange row with numeric code and no score', () => {
    expect(courses[28]).toEqual({
      code: '1', section: '00', name: 'Introduction to Data Science', category: '전공선택', area: '외국대학연수과목',
      credits: 3, score: null, grade: 'S', point: 0,
    })
  })
  test('parses with CRLF and blank lines', () => {
    const messy = coursesText.split('\n').map((l) => l + '  ').join('\r\n').replace('STAT201', '\r\n\r\nSTAT201')
    expect(parseCourseGrades(messy)).toEqual(courses)
  })
  test('unknown category keeps name intact', () => {
    const a = parseCourseGrades('STAT999\n01\n이상한과목\n교직\n3\n100\nA+\n4.5')
    expect(a[0].name).toBe('이상한과목')
    expect(a[0].category).toBe('교직')
    const b = parseCourseGrades('STAT998\n01\n더이상한과목\n듣보분류\n3\n100\nA+\n4.5')
    expect(b[0].name).toBe('더이상한과목')
    expect(b[0].category).toBe('')
    expect(b[0].area).toBe('듣보분류')
  })
})

describe('assignTerms', () => {
  const terms = parseTermGrades(termsText)
  const courses = parseCourseGrades(coursesText)
  test('assigns fixture courses to terms by credit totals', () => {
    const { assigned, warnings } = assignTerms(terms, courses)
    const counts = terms.map((t) => assigned.filter((c) => c.termCode === t.code).length)
    expect(counts).toEqual([7, 1, 8, 1, 5, 6, 4])
    expect(warnings).toEqual([])
    expect(assigned.slice(-4).every((c) => c.termCode === '2026-1')).toBe(true)
  })
  test('warns when courses run out before a term is filled', () => {
    const { assigned, warnings } = assignTerms(terms, courses.slice(0, -2))
    expect(assigned).toHaveLength(30)
    expect(assigned.every((c) => c.termCode !== null)).toBe(true)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('2026-1')
  })
  test('leaves leftover courses unassigned with a warning', () => {
    const extra = { ...courses[0], code: 'EXTRA01' }
    const { assigned, warnings } = assignTerms(terms, [...courses, extra])
    expect(assigned[assigned.length - 1].termCode).toBeNull()
    expect(warnings).toHaveLength(1)
  })
  test('does not warn for a term with no courses yet', () => {
    const withEmpty = parseTermGrades(termsText + '\n2026학년도 2학기\n15\n0\n0\n0\n0\n0')
    const { warnings } = assignTerms(withEmpty, courses)
    expect(warnings).toEqual([])
  })
})
