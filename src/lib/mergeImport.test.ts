import { mergeImport } from './mergeImport'
import type { Course, ParsedCourse, TermCode } from './types'

const base: Omit<Course, 'id' | 'source'> = {
  code: 'STAT101', section: '00', name: '통계학', category: '전공필수', area: '', credits: 3, score: 90, grade: 'A', point: 4.0,
  termCode: '2024-1', supersededBy: null, order: 0,
}
const existing: Course[] = [
  { ...base, id: 'p1', source: 'portal' },
  { ...base, id: 'p2', source: 'portal', code: 'STAT102' },
  { ...base, id: 'm1', source: 'manual', code: 'MANUAL1' },
]
const parsed: (ParsedCourse & { termCode: TermCode | null })[] = [
  { code: 'STAT101', section: '00', name: '통계학', category: '전공필수', area: '', credits: 3, score: 90, grade: 'A', point: 4.0, termCode: '2024-1' },
  { code: 'STAT102', section: '00', name: '확률론', category: '전공선택', area: '', credits: 3, score: 95, grade: 'A+', point: 4.5, termCode: '2024-1' },
  { code: 'GEKS001', section: '01', name: '글쓰기', category: '교양', area: '', credits: 2, score: null, grade: 'P', point: 0, termCode: null },
]

describe('mergeImport', () => {
  test('deletes all portal courses and keeps manual ones', () => {
    const { deleteIds } = mergeImport(existing, parsed)
    expect(deleteIds.sort()).toEqual(['p1', 'p2'])
    expect(deleteIds).not.toContain('m1')
  })

  test('writes every parsed course as a portal course with no superseder', () => {
    const { toWrite } = mergeImport(existing, parsed)
    expect(toWrite).toHaveLength(3)
    for (const c of toWrite) {
      expect(c.source).toBe('portal')
      expect(c.supersededBy).toBeNull()
    }
    expect(toWrite[2].termCode).toBeNull()
  })

  test('works with no existing courses', () => {
    const { toWrite, deleteIds } = mergeImport([], parsed)
    expect(deleteIds).toEqual([])
    expect(toWrite).toHaveLength(3)
  })
})
