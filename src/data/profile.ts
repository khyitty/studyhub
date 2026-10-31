import { DEFAULT_SCALE4 } from '../lib/gpa'
import type { Grade, TermCode } from '../lib/types'
import { COVERS, HUES, type Cover, type Hue } from '../lib/theme'

export interface Profile {
  lang: 'ko' | 'en'
  theme: 'system' | 'light' | 'dark'
  /** accent preset; every colored surface derives from its 6 shades */
  themeHue: Hue
  /** home cover pattern */
  cover: Cover
  currentTerm: TermCode
  termStart: string
  termEnd: string
  gradReq: { total: number; major: number; liberal: number }
  gpa4Scale: Record<Grade, number>
  gpaPortal: number | null
  appName: string
  /** default categories were created once for this user */
  categoriesSeeded: boolean
  /** default schedule kinds were created once for this user */
  kindsSeeded: boolean
  /** credit categories were seeded once (from existing courses or defaults) */
  creditCatsSeeded: boolean
  /** my TOEFL score, compared against each school's minimum */
  toeflScore: number | null
}

export const DEFAULT_PROFILE: Profile = {
  lang: 'ko',
  theme: 'system',
  themeHue: 'green',
  cover: 'leaf',
  currentTerm: '2026-2',
  termStart: '2026-09-01',
  termEnd: '2026-12-20',
  gradReq: { total: 130, major: 0, liberal: 0 },
  gpa4Scale: DEFAULT_SCALE4,
  gpaPortal: null,
  appName: 'StudyHub',
  categoriesSeeded: false,
  kindsSeeded: false,
  creditCatsSeeded: false,
  toeflScore: null,
}

/** Fill defaults for missing fields. Legacy `xp` in the document is ignored. */
export function normalizeProfile(raw: Partial<Profile> | undefined): Profile {
  return {
    ...DEFAULT_PROFILE,
    ...raw,
    themeHue: HUES.includes(raw?.themeHue as Hue) ? (raw!.themeHue as Hue) : DEFAULT_PROFILE.themeHue,
    cover: COVERS.includes(raw?.cover as Cover) ? (raw!.cover as Cover) : DEFAULT_PROFILE.cover,
    gradReq: { ...DEFAULT_PROFILE.gradReq, ...(raw?.gradReq ?? {}) },
    gpa4Scale: { ...DEFAULT_PROFILE.gpa4Scale, ...(raw?.gpa4Scale ?? {}) },
  }
}
