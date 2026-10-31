import { DEFAULT_PROFILE, normalizeProfile } from './profile'

describe('normalizeProfile', () => {
  test('fills defaults', () => {
    expect(normalizeProfile(undefined)).toEqual(DEFAULT_PROFILE)
  })
  test('clamps negative xp to 0', () => {
    expect(normalizeProfile({ xp: -5 }).xp).toBe(0)
  })
  test('keeps nested defaults when partially set', () => {
    expect(normalizeProfile({ gradReq: { total: 120 } as never }).gradReq).toEqual({ total: 120, major: 0, liberal: 0 })
  })
})

test('new fields default: categoriesSeeded false, toeflScore null', () => {
  const p = normalizeProfile({})
  expect(p.categoriesSeeded).toBe(false)
  expect(p.toeflScore).toBeNull()
})

test('v2 fields default: themeHue green, cover leaf, seeds false', () => {
  const p = normalizeProfile({})
  expect(p.themeHue).toBe('green')
  expect(p.cover).toBe('leaf')
  expect(p.kindsSeeded).toBe(false)
  expect(p.creditCatsSeeded).toBe(false)
})
test('unknown themeHue/cover fall back to defaults', () => {
  expect(normalizeProfile({ themeHue: 'neon', cover: 'photo' } as never)).toMatchObject({ themeHue: 'green', cover: 'leaf' })
})
