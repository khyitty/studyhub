import { addDays, isBetween, startOfWeek, todayISO, weekdayOf } from './dates'

describe('dates', () => {
  test('weekdayOf: Mon=1 … Sun=7', () => {
    expect(weekdayOf('2026-10-29')).toBe(4) // Thursday
    expect(weekdayOf('2026-10-26')).toBe(1) // Monday
    expect(weekdayOf('2026-11-01')).toBe(7) // Sunday
  })
  test('startOfWeek returns the Monday', () => {
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26')
    expect(startOfWeek('2026-10-26')).toBe('2026-10-26')
    expect(startOfWeek('2026-10-29')).toBe('2026-10-26')
  })
  test('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  test('isBetween is inclusive at both ends', () => {
    expect(isBetween('2026-09-01', '2026-09-01', '2026-12-20')).toBe(true)
    expect(isBetween('2026-12-20', '2026-09-01', '2026-12-20')).toBe(true)
    expect(isBetween('2026-12-21', '2026-09-01', '2026-12-20')).toBe(false)
    expect(isBetween('2026-08-31', '2026-09-01', '2026-12-20')).toBe(false)
  })
  test('todayISO is a local YYYY-MM-DD', () => {
    const d = new Date()
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(todayISO()).toBe(expected)
  })
})
