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

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ON_COLOR, contrastRatio, onColorHex } from './theme'

test('contrastRatio: black on white is 21, same color is 1', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  expect(contrastRatio('#789B7C', '#789B7C')).toBe(1)
})

test('text placed on any shade reads at ≥ 4.5:1 in both modes, for every preset', () => {
  for (const h of HUES) for (const mode of ['light', 'dark'] as const) for (const s of SHADES) {
    const bg = HUE_RAMP[h][mode][s - 1]
    expect(contrastRatio(bg, onColorHex(h, s, mode)), `${h} ${mode} s${s}`).toBeGreaterThanOrEqual(4.5)
  }
})

test('index.css --color-sN-on rules match ON_COLOR (light @theme block, dark .dark block)', () => {
  const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')
  const theme = css.slice(css.indexOf('@theme'), css.indexOf('@layer base'))
  const dark = css.slice(css.indexOf('.dark {', css.indexOf('@layer base')), css.indexOf(':root[data-hue='))
  const expectVar = (block: string, s: number, v: string) => {
    const m = block.match(new RegExp(`--color-s${s}-on:\s*([^;]+);`))
    expect(m?.[1].trim(), `s${s}-on`).toBe(v === 's6' ? 'var(--color-s6)' : v)
  }
  for (const s of SHADES) expectVar(theme, s, ON_COLOR.light[s])
  for (const s of SHADES) if (ON_COLOR.dark[s] !== ON_COLOR.light[s]) expectVar(dark, s, ON_COLOR.dark[s])
})
