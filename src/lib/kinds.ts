import type { DocumentData } from 'firebase/firestore'
import type { Profile } from '../data/profile'
import { SHADE_CLASS, textShade, toShade } from './theme'
import type { Shade } from './types'

/** A user-managed schedule kind (수업 · 연구 · 일 …). `ScheduleItem.kind` holds its id. */
export interface Kind {
  id: string
  name: string
  shade: Shade
  order: number
}

export const OTHER_KIND_ID = 'seed-other'

/** Fixed ids so seeding is idempotent (setDoc). Names are Korean, like the category seed. */
export const DEFAULT_KINDS: Kind[] = [
  { id: 'seed-class', name: '수업', shade: 2, order: 0 },
  { id: 'seed-research', name: '연구', shade: 4, order: 1 },
  { id: 'seed-work', name: '일', shade: 1, order: 2 },
  { id: OTHER_KIND_ID, name: '기타', shade: 5, order: 3 },
]

/** Phase-1 `kind` values → seed ids. */
export const LEGACY_KIND: Record<string, string> = { class: 'seed-class', research: 'seed-research', work: 'seed-work', other: OTHER_KIND_ID }

export function normalizeKind(raw: DocumentData, id: string): Kind {
  return {
    id,
    name: String(raw.name ?? ''),
    shade: toShade(raw.shade),
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : 0,
  }
}

/** The kind for an item; unknown ids (deleted kinds) render as "기타", even before the seed exists. */
export function kindOf(kinds: Kind[], id: string): Kind {
  return kinds.find((k) => k.id === id) ?? kinds.find((k) => k.id === OTHER_KIND_ID) ?? DEFAULT_KINDS[3]
}

/** Tailwind classes: surface uses the shade; text sits on it; thin border / 3px bar use the lifted text shade. */
export function kindStyle(k: Kind): { bg: string; text: string; border: string; bar: string } {
  const lifted = SHADE_CLASS[textShade(k.shade)]
  return { bg: SHADE_CLASS[k.shade].fill, text: SHADE_CLASS[k.shade].on, border: lifted.border, bar: lifted.fill }
}

export function shouldSeedKinds(profile: Pick<Profile, 'kindsSeeded'>, kinds: Kind[], kindsLoading: boolean, profileLoading: boolean): boolean {
  if (kindsLoading || profileLoading) return false
  if (profile.kindsSeeded === true) return false
  return kinds.length === 0
}
