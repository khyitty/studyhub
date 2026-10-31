import type { Shade } from './types'

export const HUES = ['green', 'blue', 'purple', 'brown', 'rose', 'gray'] as const
export type Hue = (typeof HUES)[number]

export const COVERS = ['leaf', 'wave', 'grid', 'solid', 'none'] as const
export type Cover = (typeof COVERS)[number]

export const SHADES: Shade[] = [1, 2, 3, 4, 5, 6]

/** Tailwind classes per shade, spelled out so the compiler can see them. `on` = text color that sits on that shade. */
export const SHADE_CLASS: Record<Shade, { fill: string; text: string; border: string; on: string }> = {
  1: { fill: 'bg-s1', text: 'text-s1', border: 'border-s1', on: 'text-s1-on' },
  2: { fill: 'bg-s2', text: 'text-s2', border: 'border-s2', on: 'text-s2-on' },
  3: { fill: 'bg-s3', text: 'text-s3', border: 'border-s3', on: 'text-s3-on' },
  4: { fill: 'bg-s4', text: 'text-s4', border: 'border-s4', on: 'text-s4-on' },
  5: { fill: 'bg-s5', text: 'text-s5', border: 'border-s5', on: 'text-s5-on' },
  6: { fill: 'bg-s6', text: 'text-s6', border: 'border-s6', on: 'text-s6-on' },
}

/** Shades 1–3 vanish as thin text/borders on a white page; lift them to 4 for text, borders and bars. */
export function textShade(s: Shade): Shade {
  return s < 4 ? 4 : s
}

/** Phase-1 pastel names → shade (read-time migration). */
export const LEGACY_COLOR_SHADE: Record<string, Shade> = { butter: 1, sky: 2, mint: 3, pink: 4, lilac: 5, peach: 6 }

export function toShade(raw: unknown, fallback: Shade = 2): Shade {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 6) return raw as Shade
  if (typeof raw === 'string' && raw in LEGACY_COLOR_SHADE) return LEGACY_COLOR_SHADE[raw]
  return fallback
}

/** Preset ramps, s1 (lightest) … s6 (darkest) in light mode; dark mode flips lightness around the page background. Must match index.css. */
export const HUE_RAMP: Record<Hue, { light: string[]; dark: string[]; cover: string; coverDark: string }> = {
  green: { light: ['#E3ECE2', '#C5D8C4', '#A3C0A4', '#789B7C', '#55795B', '#3A5A41'], dark: ['#223527', '#2E4733', '#3F5E45', '#7FA486', '#A3C3A8', '#C9DECB'], cover: '#EEF3EC', coverDark: '#182219' },
  blue: { light: ['#E3E9F0', '#C4D2E1', '#9FB5CB', '#7591AE', '#526F8E', '#375069'], dark: ['#1F2A36', '#2A3A4B', '#3B5168', '#7E9AB8', '#A4BBD2', '#C8D6E4'], cover: '#EEF1F5', coverDark: '#161D25' },
  purple: { light: ['#E9E5F0', '#D1C9E1', '#B3A7CC', '#8E7FB0', '#6C5E8E', '#4E4269'], dark: ['#2A2537', '#3A334C', '#4F4668', '#9387B8', '#B3A9CF', '#D0C9E2'], cover: '#F2F0F6', coverDark: '#1D1926' },
  brown: { light: ['#EFE8E0', '#DCCDBC', '#C2AC94', '#A2866B', '#7E6650', '#5B4837'], dark: ['#332A22', '#46392D', '#5E4D3D', '#B09377', '#CBB49C', '#E0D2C2'], cover: '#F6F2EC', coverDark: '#221C16' },
  rose: { light: ['#F1E4E6', '#E1C8CD', '#CBA6AE', '#AF7F8B', '#8D5F6B', '#67434D'], dark: ['#352529', '#493239', '#62434C', '#B88A96', '#D0ACB5', '#E3CCD2'], cover: '#F6EEF0', coverDark: '#241A1D' },
  gray: { light: ['#EAEAEA', '#D3D3D3', '#B4B4B4', '#8E8E8E', '#6A6A6A', '#474747'], dark: ['#2A2A2A', '#383838', '#4A4A4A', '#9A9A9A', '#B8B8B8', '#D4D4D4'], cover: '#F2F2F2', coverDark: '#1C1C1C' },
}

/** Text color that sits on each shade: the darkest shade itself, or plain black/white. Must match the `--color-sN-on` rules in index.css. */
export type OnColor = 's6' | '#111111' | '#ffffff'
export const ON_COLOR: Record<'light' | 'dark', Record<Shade, OnColor>> = {
  // shades 3–4 sit around mid-lightness: neither s6 nor white reaches 4.5:1 on them, so plain black text
  light: { 1: 's6', 2: 's6', 3: '#111111', 4: '#111111', 5: '#ffffff', 6: '#ffffff' },
  dark: { 1: 's6', 2: 's6', 3: 's6', 4: '#111111', 5: '#111111', 6: '#111111' },
}

export function onColorHex(hue: Hue, shade: Shade, mode: 'light' | 'dark'): string {
  const on = ON_COLOR[mode][shade]
  return on === 's6' ? HUE_RAMP[hue][mode][5] : on
}

/** WCAG 2.x contrast ratio between two #rrggbb colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    const ch = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
