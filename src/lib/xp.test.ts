import { XP_TODO, applyXp, levelFor, levelProgress, xpForLevel } from './xp'

describe('xp', () => {
  test('XP_TODO is 10', () => expect(XP_TODO).toBe(10))
  test('levelFor', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(49)).toBe(1)
    expect(levelFor(50)).toBe(2)
    expect(levelFor(200)).toBe(3)
  })
  test('xpForLevel(3) === 200', () => expect(xpForLevel(3)).toBe(200))
  test('levelProgress(60)', () => {
    expect(levelProgress(60)).toEqual({ level: 2, current: 10, needed: 150, ratio: 10 / 150 })
  })
  test('xp never negative', () => {
    expect(applyXp(5, -10)).toBe(0)
    expect(applyXp(5, 10)).toBe(15)
  })
})
