import { dday, ddayLabel, filterSchools, nearestDeadlines, normalizeSchool, recsStatus, sortSchools, toeflStatus } from './schools'
import type { School } from './types'
const s = (id: string, deadline: string, status: School['status'] = 'preparing'): School =>
  ({ ...normalizeSchool({ name: id, program: 'Stat PhD', deadline, status }, id) })

test('dday and label', () => {
  expect(dday('2026-12-01', '2026-10-29')).toBe(33)
  expect(dday('2026-10-29', '2026-10-29')).toBe(0)
  expect(dday('2026-10-27', '2026-10-29')).toBe(-2)
  expect(ddayLabel(0)).toBe('D-day'); expect(ddayLabel(5)).toBe('D-5'); expect(ddayLabel(-2)).toBe('D+2')
})
test('toeflStatus: unknown when either side missing', () => {
  expect(toeflStatus(100, null)).toBe('unknown'); expect(toeflStatus(null, 90)).toBe('unknown')
  expect(toeflStatus(84, 82)).toBe('short'); expect(toeflStatus(84, 84)).toBe('ok')
})
test('recsStatus', () => { expect(recsStatus(3, 3)).toBe('ok'); expect(recsStatus(2, 3)).toBe('warn') })
test('sortSchools by deadline puts past ones last, today counts as upcoming', () => {
  const out = sortSchools([s('late', '2026-12-15'), s('past', '2026-10-01'), s('today', '2026-10-29'), s('soon', '2026-12-01')], 'deadline', '2026-10-29')
  expect(out.map((x) => x.id)).toEqual(['today', 'soon', 'late', 'past'])
})
test('filterSchools result = accepted + rejected', () => {
  const list = [s('a', '2026-12-01', 'accepted'), s('b', '2026-12-01', 'rejected'), s('c', '2026-12-01', 'submitted')]
  expect(filterSchools(list, 'result').map((x) => x.id)).toEqual(['a', 'b'])
  expect(filterSchools(list, 'all')).toHaveLength(3)
})
test('nearestDeadlines: only interested/preparing and not past, max n', () => {
  const list = [s('a', '2026-12-01'), s('b', '2026-11-15', 'submitted'), s('c', '2026-10-01'), s('d', '2026-11-20', 'interested'), s('e', '2026-12-10')]
  expect(nearestDeadlines(list, '2026-10-29', 2).map((x) => x.id)).toEqual(['d', 'a'])
})
test('normalizeSchool fills defaults', () => {
  const x = normalizeSchool({ name: 'X' }, 'x')
  expect(x).toMatchObject({ gre: 'none', sop: 'todo', recsRequired: 3, recsDone: 0, status: 'interested', links: [], professors: [], toeflMin: null, fee: '' })
})
