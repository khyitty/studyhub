import {
  DEFAULT_CREDIT_CATS, OTHER_CAT_ID, catFor, cellCourses, gridRows, gridTermLabel, majorNames, normalizeCreditCat,
  renamePlan, seedCatsFromCourses, shouldSeedCreditCats,
} from './creditCats'
import type { Course, Grade, TermCode } from './types'

const c = (id: string, category: string, termCode: TermCode | null, credits = 3, grade: Grade = 'A', order = 0): Course => ({
  id, code: id.toUpperCase(), section: '00', name: id, category, area: '', credits, score: null, grade,
  point: grade === 'F' ? 0 : 4, termCode, source: 'portal', supersededBy: null, order,
})

test('catFor matches by name or alias; unknown → null', () => {
  const cats = [{ ...DEFAULT_CREDIT_CATS[0], aliases: ['전필'] }]
  expect(catFor(cats, '전공필수')?.id).toBe('seed-major-req')
  expect(catFor(cats, '전필')?.id).toBe('seed-major-req')
  expect(catFor(cats, '교직')).toBeNull()
})

test('seedCatsFromCourses: distinct categories in (term, order) order, 전공 → major; no courses → defaults', () => {
  const terms = [{ code: '2024-1', order: 1 }, { code: '2024-2', order: 2 }] as never
  const courses = [c('a', '교양', '2024-2', 3, 'A', 1), c('b', '전공선택', '2024-1', 3, 'A', 2), c('c', '학문의기초', '2024-1', 3, 'A', 1), c('d', '교양', '2024-1', 3, 'A', 3)]
  expect(seedCatsFromCourses(courses, terms).map((x) => [x.name, x.isMajor, x.order])).toEqual([['학문의기초', false, 0], ['전공선택', true, 1], ['교양', false, 2]])
  expect(seedCatsFromCourses([], terms)).toEqual(DEFAULT_CREDIT_CATS)
})

test('seeded ids are deterministic (seed-0, seed-1, …) so a second seeder overwrites', () => {
  expect(seedCatsFromCourses([c('a', '교양', '2024-1')], []).map((x) => x.id)).toEqual(['seed-0'])
})

test('renamePlan keeps the old name as alias and lists courses to rewrite', () => {
  const cat = { ...DEFAULT_CREDIT_CATS[2], aliases: ['교양과목'] }
  const plan = renamePlan(cat, '교양·일반', [c('a', '교양', null), c('b', '교양과목', null), c('x', '전공선택', null)])
  expect(plan).toEqual({ catPatch: { name: '교양·일반', aliases: ['교양과목', '교양'] }, courseIds: ['a', 'b'] })
})

test('gridRows: rows in cat order, other row last and always present, earned excludes superseded and F', () => {
  const courses = [c('a', '전공필수', '2024-1'), { ...c('b', '전공필수', '2023-1'), supersededBy: 'a' }, c('f', '교양', '2024-1', 3, 'F'), c('z', '교직', null)]
  const rows = gridRows(DEFAULT_CREDIT_CATS, courses)
  expect(rows.map((r) => r.id)).toEqual(['seed-major-req', 'seed-major-elec', 'seed-liberal', 'seed-basic', OTHER_CAT_ID])
  expect(rows[0].earned).toBe(3)
  expect(rows[0].courses).toHaveLength(2)
  expect(rows[2].earned).toBe(0)
  expect(rows[4].courses.map((x) => x.id)).toEqual(['z'])
})

test('cellCourses picks a term (or null = unassigned) sorted by order', () => {
  const row = gridRows(DEFAULT_CREDIT_CATS, [c('b', '교양', '2024-1', 3, 'A', 2), c('a', '교양', '2024-1', 3, 'A', 1), c('u', '교양', null)])[2]
  expect(cellCourses(row, '2024-1').map((x) => x.id)).toEqual(['a', 'b'])
  expect(cellCourses(row, null).map((x) => x.id)).toEqual(['u'])
})

test('gridTermLabel', () => {
  expect(gridTermLabel('2024-1', 2024, 'ko')).toBe('1학년 1학기')
  expect(gridTermLabel('2025-2', 2024, 'ko')).toBe('2학년 2학기')
  expect(gridTermLabel('2024-S', 2024, 'ko')).toBe('2024 여름')
  expect(gridTermLabel('2025-2', 2024, 'en')).toBe('Y2 Fall')
  expect(gridTermLabel('2024-W', 2024, 'en')).toBe('2024 Winter')
})

test('majorNames includes aliases of major rows only', () => {
  expect(majorNames([{ ...DEFAULT_CREDIT_CATS[0], aliases: ['전필'] }, DEFAULT_CREDIT_CATS[2]])).toEqual(['전공필수', '전필'])
})

test('shouldSeedCreditCats waits for courses and cats to load', () => {
  expect(shouldSeedCreditCats({ creditCatsSeeded: false }, [], false, false, false)).toBe(true)
  expect(shouldSeedCreditCats({ creditCatsSeeded: false }, [], false, true, false)).toBe(false)
  expect(shouldSeedCreditCats({ creditCatsSeeded: true }, [], false, false, false)).toBe(false)
})

test('normalizeCreditCat defaults', () => {
  expect(normalizeCreditCat({ name: '교양' }, 'x')).toEqual({ id: 'x', name: '교양', aliases: [], required: 0, isMajor: false, order: 0 })
})
