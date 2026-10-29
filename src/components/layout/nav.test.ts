import { SIDEBAR_NAV, TAB_NAV, SETTINGS_NAV } from './nav'

test('tab bar has exactly 5 items: home, grades, timetable, grad, more', () => {
  expect(TAB_NAV.map((n) => n.to)).toEqual(['/', '/grades', '/timetable', '/grad', '/more'])
})
test('sidebar order and settings at the bottom', () => {
  expect(SIDEBAR_NAV.map((n) => n.to)).toEqual(['/', '/grades', '/timetable', '/papers', '/research', '/grad'])
  expect(SETTINGS_NAV.to).toBe('/settings')
})
