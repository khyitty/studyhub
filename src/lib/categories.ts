import type { DocumentData } from 'firebase/firestore'
import type { Profile } from '../data/profile'
import type { Category, PaletteColor, Todo } from './types'

export const PALETTE: PaletteColor[] = ['sky', 'mint', 'pink', 'butter', 'lilac', 'peach']

/** Tailwind classes per pastel color: fill (bg), text (darker), border (fill color), borderText (darker). Spelled out so Tailwind can see them. */
export const PALETTE_CLASS: Record<PaletteColor, { fill: string; text: string; border: string; borderText: string }> = {
  sky: { fill: 'bg-sky', text: 'text-sky-text', border: 'border-sky', borderText: 'border-sky-text' },
  mint: { fill: 'bg-mint', text: 'text-mint-text', border: 'border-mint', borderText: 'border-mint-text' },
  pink: { fill: 'bg-pink', text: 'text-pink-text', border: 'border-pink', borderText: 'border-pink-text' },
  butter: { fill: 'bg-butter', text: 'text-butter-text', border: 'border-butter', borderText: 'border-butter-text' },
  lilac: { fill: 'bg-lilac', text: 'text-lilac-text', border: 'border-lilac', borderText: 'border-lilac-text' },
  peach: { fill: 'bg-peach', text: 'text-peach-text', border: 'border-peach', borderText: 'border-peach-text' },
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '공부', color: 'sky', order: 0 },
  { name: '연구', color: 'mint', order: 1 },
  { name: '대학원', color: 'pink', order: 2 },
]

export const OTHER_GROUP_ID = '__other__'

export interface TodoGroup {
  id: string
  category: Category | null
  todos: Todo[]
}

/** Groups in category order (empty groups included); "other" last, always present. Todo order inside a group is preserved. */
export function groupTodos(todos: Todo[], categories: Category[]): TodoGroup[] {
  const sorted = [...categories].sort((a, b) => a.order - b.order)
  const groups: TodoGroup[] = sorted.map((c) => ({ id: c.id, category: c, todos: [] }))
  const byId = new Map(groups.map((g) => [g.id, g]))
  const other: TodoGroup = { id: OTHER_GROUP_ID, category: null, todos: [] }
  for (const t of todos) {
    const g = t.categoryId ? byId.get(t.categoryId) : undefined
    ;(g ?? other).todos.push(t)
  }
  groups.push(other)
  return groups
}

export function shouldSeedCategories(profile: Pick<Profile, 'categoriesSeeded'>, categories: Category[], categoriesLoading: boolean, profileLoading: boolean): boolean {
  if (categoriesLoading || profileLoading) return false
  if (profile.categoriesSeeded === true) return false
  return categories.length === 0
}

export function normalizeCategory(raw: DocumentData, id: string): Category {
  const color = PALETTE.includes(raw.color) ? (raw.color as PaletteColor) : 'sky'
  return {
    id,
    name: String(raw.name ?? ''),
    color,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : 0,
  }
}
