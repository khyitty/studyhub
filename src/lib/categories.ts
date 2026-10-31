import type { DocumentData } from 'firebase/firestore'
import type { Profile } from '../data/profile'
import { toShade } from './theme'
import type { Category, Todo } from './types'

/** Fixed ids: seeding is written with setDoc, so a second seeder (another tab/device) overwrites instead of duplicating. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'seed-study', name: '공부', shade: 2, order: 0 },
  { id: 'seed-research', name: '연구', shade: 3, order: 1 },
  { id: 'seed-grad', name: '대학원', shade: 4, order: 2 },
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
  return {
    id,
    name: String(raw.name ?? ''),
    // phase-1 docs carry a pastel `color` name; new docs carry `shade`
    shade: toShade(raw.shade ?? raw.color),
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : 0,
  }
}
