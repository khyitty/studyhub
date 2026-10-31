import { DEFAULT_KINDS, LEGACY_KIND, OTHER_KIND_ID, kindOf, kindStyle, normalizeKind, shouldSeedKinds } from './kinds'

test('default kinds: 수업 2, 연구 4, 일 1, 기타 5 with fixed ids', () => {
  expect(DEFAULT_KINDS.map((k) => [k.id, k.name, k.shade])).toEqual([
    ['seed-class', '수업', 2], ['seed-research', '연구', 4], ['seed-work', '일', 1], ['seed-other', '기타', 5],
  ])
})

test('legacy values map to seed ids', () => {
  expect(LEGACY_KIND).toEqual({ class: 'seed-class', research: 'seed-research', work: 'seed-work', other: 'seed-other' })
})

test('kindOf falls back to seed-other, then to the built-in other', () => {
  expect(kindOf(DEFAULT_KINDS, 'gone').id).toBe(OTHER_KIND_ID)
  expect(kindOf([], 'gone')).toEqual(DEFAULT_KINDS[3])
  expect(kindOf(DEFAULT_KINDS, 'seed-work').name).toBe('일')
})

test('kindStyle: surface uses shade, border/bar use textShade', () => {
  expect(kindStyle(DEFAULT_KINDS[2])).toEqual({ bg: 'bg-s1', text: 'text-s1-on', border: 'border-s4', bar: 'bg-s4' })
})

test('normalizeKind coerces shade and order', () => {
  expect(normalizeKind({ name: 'x', shade: 'sky' }, 'k')).toEqual({ id: 'k', name: 'x', shade: 2, order: 0 })
})

test('shouldSeedKinds', () => {
  expect(shouldSeedKinds({ kindsSeeded: false }, [], false, false)).toBe(true)
  expect(shouldSeedKinds({ kindsSeeded: true }, [], false, false)).toBe(false)
  expect(shouldSeedKinds({ kindsSeeded: false }, DEFAULT_KINDS, false, false)).toBe(false)
  expect(shouldSeedKinds({ kindsSeeded: false }, [], true, false)).toBe(false)
})
