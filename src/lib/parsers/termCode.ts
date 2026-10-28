import type { TermCode } from '../types'

const SEASON_ORDER: Record<string, number> = { '1': 1, S: 2, '2': 3, W: 4 }

/** '2024학년도 계절수업(여름)' → '2024-S' */
export function termCodeFromLabel(label: string): TermCode {
  const year = label.match(/(\d{4})/)?.[1] ?? '0000'
  let season = '1'
  if (/여름|summer/i.test(label)) season = 'S'
  else if (/겨울|winter/i.test(label)) season = 'W'
  else if (/2학기|fall|autumn/i.test(label)) season = '2'
  return `${year}-${season}`
}

export function termOrder(code: TermCode): number {
  const [year, season] = code.split('-')
  return Number(year) * 10 + (SEASON_ORDER[season] ?? 0)
}

export function termLabel(code: TermCode, lang: 'ko' | 'en'): string {
  const [year, season] = code.split('-')
  const ko: Record<string, string> = { '1': '1학기', S: '여름', '2': '2학기', W: '겨울' }
  const en: Record<string, string> = { '1': 'Spring', S: 'Summer', '2': 'Fall', W: 'Winter' }
  const map = lang === 'ko' ? ko : en
  return `${year} ${map[season] ?? season}`
}

export function isTermCode(s: string): boolean {
  return /^\d{4}-[12SW]$/.test(s)
}
