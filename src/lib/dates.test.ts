import { addDays, formatDateHeading, formatShortDate, isBetween, startOfWeek, todayISO, weekDays, weekdayOf } from './dates'

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

test('weekDays returns Mon..Sun from a Monday', () => {
  expect(weekDays('2026-10-26')).toEqual(['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01'])
})
test('formatDateHeading ko/en', () => {
  expect(formatDateHeading('2026-10-29', 'ko')).toBe('10월 29일 목요일')
  expect(formatDateHeading('2026-10-29', 'en')).toBe('Thursday, October 29')
})
test('formatShortDate drops leading zeros', () => {
  expect(formatShortDate('2026-10-05')).toBe('10/5')
})
