import { itemsOnDate, validateScheduleItem } from './schedule'
import type { ScheduleItem } from '../../lib/types'

const weekly: ScheduleItem = {
  id: 'w', title: '회귀분석', kind: 'class', days: [1, 3], start: '09:00', end: '10:15', place: '정경관',
  repeat: 'weekly', date: null, from: '2026-09-01', to: '2026-12-20',
}
const once: ScheduleItem = {
  id: 'o', title: '미팅', kind: 'research', days: [], start: '14:00', end: '15:00', place: '',
  repeat: 'once', date: '2026-10-29', from: '2026-09-01', to: '2026-12-20',
}
const early: ScheduleItem = { ...weekly, id: 'e', title: '아침 세미나', days: [4], start: '08:00', end: '09:00' }

describe('validateScheduleItem', () => {
  const base = (() => { const { id: _id, ...rest } = weekly; return rest })()
  test('end before or equal to start', () => {
    expect(validateScheduleItem({ ...base, start: '10:00', end: '09:00' })).toEqual(['timetable.errEndBeforeStart'])
    expect(validateScheduleItem({ ...base, start: '10:00', end: '10:00' })).toEqual(['timetable.errEndBeforeStart'])
  })
  test('weekly with no days', () => {
    expect(validateScheduleItem({ ...base, days: [] })).toEqual(['timetable.errNoDays'])
  })
  test('once with no date', () => {
    expect(validateScheduleItem({ ...base, repeat: 'once', date: null })).toEqual(['timetable.errNoDate'])
  })
  test('empty title', () => {
    expect(validateScheduleItem({ ...base, title: '  ' })).toEqual(['timetable.errNoTitle'])
  })
  test('valid item', () => {
    expect(validateScheduleItem(base)).toEqual([])
    expect(validateScheduleItem({ ...base, repeat: 'once', date: '2026-10-29', days: [] })).toEqual([])
  })
})

describe('itemsOnDate', () => {
  const all = [once, weekly, early]
  test('weekly item shows on a matching weekday inside its period', () => {
    expect(itemsOnDate(all, '2026-10-28').map((x) => x.id)).toEqual(['w']) // Wednesday
  })
  test('once item shows only on its date, sorted by start', () => {
    expect(itemsOnDate(all, '2026-10-29').map((x) => x.id)).toEqual(['e', 'o']) // Thursday
  })
  test('nothing outside the period', () => {
    expect(itemsOnDate(all, '2027-01-05')).toEqual([]) // Wednesday after `to`
    expect(itemsOnDate(all, '2026-08-31')).toEqual([]) // Monday before `from`
  })
})
