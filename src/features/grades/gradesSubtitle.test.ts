import { gradesSubtitle } from './gradesSubtitle'
import { translate } from '../../i18n/useT'
const t = (k: string, v?: Record<string, string | number>) => translate('ko', k, v)
const term = (code: string) => ({ code, label: code, order: 0, requested: null, earned: null, totalPoints: null, gpaCert: null, gpa: null, gpa100: null })

test('range, count and portal match', () => {
  expect(gradesSubtitle([term('2024-1'), term('2026-1')], 4.21, 4.21, t)).toBe('2024-1 ~ 2026-1 · 2개 학기 · 포탈과 일치')
})
test('portal difference shown to 2 decimals', () => {
  expect(gradesSubtitle([term('2024-1')], 4.21, 4.25, t)).toBe('2024-1 ~ 2024-1 · 1개 학기 · 포탈과 0.04 차이')
})
test('no portal → no suffix; no terms → empty', () => {
  expect(gradesSubtitle([term('2024-1')], 4.2, null, t)).toBe('2024-1 ~ 2024-1 · 1개 학기')
  expect(gradesSubtitle([], null, null, t)).toBe('')
})
