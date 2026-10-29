import { DEFAULT_SCALE4 } from '../lib/gpa'
import type { Grade, TermCode } from '../lib/types'

export interface Profile {
  lang: 'ko' | 'en'
  theme: 'system' | 'light' | 'dark'
  xp: number
  currentTerm: TermCode
  termStart: string
  termEnd: string
  gradReq: { total: number; major: number; liberal: number }
  gpa4Scale: Record<Grade, number>
  gpaPortal: number | null
  appName: string
}

export const DEFAULT_PROFILE: Profile = {
  lang: 'ko',
  theme: 'system',
  xp: 0,
  currentTerm: '2026-2',
  termStart: '2026-09-01',
  termEnd: '2026-12-20',
  gradReq: { total: 130, major: 0, liberal: 0 },
  gpa4Scale: DEFAULT_SCALE4,
  gpaPortal: null,
  appName: 'StudyHub',
}

/** Fill defaults for missing fields; xp is stored with increment() so it is clamped on read. */
export function normalizeProfile(raw: Partial<Profile> | undefined): Profile {
  const xp = typeof raw?.xp === 'number' && Number.isFinite(raw.xp) ? Math.max(0, raw.xp) : 0
  return {
    ...DEFAULT_PROFILE,
    ...raw,
    xp,
    gradReq: { ...DEFAULT_PROFILE.gradReq, ...(raw?.gradReq ?? {}) },
    gpa4Scale: { ...DEFAULT_PROFILE.gpa4Scale, ...(raw?.gpa4Scale ?? {}) },
  }
}
