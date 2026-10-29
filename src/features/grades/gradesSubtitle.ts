import type { Term } from '../../lib/types'

type T = (key: string, vars?: Record<string, string | number>) => string

/** "2024-1 ~ 2026-1 · 6개 학기" + optional " · 포탈과 일치" / " · 포탈과 0.02 차이" (diff > 0.01). Empty when there are no terms. */
export function gradesSubtitle(terms: Term[], cumulative: number | null, portal: number | null, t: T): string {
  if (terms.length === 0) return ''
  const sorted = [...terms].sort((a, b) => a.order - b.order)
  let s = t('grades.subtitle', { from: sorted[0].code, to: sorted[sorted.length - 1].code, n: terms.length })
  if (portal != null && cumulative != null) {
    const diff = Math.abs(portal - cumulative)
    s += ' · ' + (diff > 0.01 ? t('grades.portalDiff', { diff: diff.toFixed(2) }) : t('grades.portalMatch'))
  }
  return s
}
