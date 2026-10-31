import { HUES, HUE_RAMP, SHADES, SHADE_CLASS, textShade, toShade } from './theme'

test('six hues, six shades, classes spelled out for Tailwind', () => {
  expect(HUES).toEqual(['green', 'blue', 'purple', 'brown', 'rose', 'gray'])
  expect(SHADES).toEqual([1, 2, 3, 4, 5, 6])
  expect(SHADE_CLASS[3]).toEqual({ fill: 'bg-s3', text: 'text-s3', border: 'border-s3', on: 'text-s3-on' })
})
test('textShade lifts light shades to 4', () => {
  expect(([1, 2, 3, 4, 5, 6] as const).map(textShade)).toEqual([4, 4, 4, 4, 5, 6])
})
test('toShade: numbers pass, legacy names map, junk falls back to 2', () => {
  expect(toShade(5)).toBe(5)
  expect(['butter', 'sky', 'mint', 'pink', 'lilac', 'peach'].map((c) => toShade(c))).toEqual([1, 2, 3, 4, 5, 6])
  expect(toShade('red')).toBe(2)
  expect(toShade(9)).toBe(2)
  expect(toShade(undefined)).toBe(2)
  expect(toShade(0, 5)).toBe(5)
})
test('every hue has 6 light + 6 dark shades and a cover color', () => {
  for (const h of HUES) {
    expect(HUE_RAMP[h].light).toHaveLength(6)
    expect(HUE_RAMP[h].dark).toHaveLength(6)
    expect(HUE_RAMP[h].cover).toMatch(/^#[0-9A-F]{6}$/i)
    expect(HUE_RAMP[h].coverDark).toMatch(/^#[0-9A-F]{6}$/i)
  }
  expect(HUE_RAMP.green.light).toEqual(['#E3ECE2', '#C5D8C4', '#A3C0A4', '#789B7C', '#55795B', '#3A5A41'])
})
