import type { DocumentData } from 'firebase/firestore'
import type { TagTone } from '../components/ui/Tag'
import type { Category, Project, ProjectStatus, Todo } from './types'

export const PROJECT_STATUSES: ProjectStatus[] = ['active', 'paused', 'done']

export const STATUS_TONE: Record<ProjectStatus, TagTone> = { active: 'ok', paused: 'warn', done: 'none' }

export function normalizeProject(raw: DocumentData, id: string): Project {
  return {
    id,
    name: String(raw.name ?? ''),
    goal: String(raw.goal ?? ''),
    status: PROJECT_STATUSES.includes(raw.status) ? raw.status : 'active',
    note: String(raw.note ?? ''),
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : 0,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  }
}

/** Open todos linked to a project (any date), oldest first. */
export function projectTodos(todos: Todo[], projectId: string): Todo[] {
  return todos
    .filter((t) => !t.done && t.source?.type === 'project' && t.source.refId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** The category a board-created todo lands in: the one named 연구 / Research, if any. */
export function researchCategoryId(categories: Category[]): string | null {
  return categories.find((c) => c.name === '연구' || c.name.toLowerCase() === 'research')?.id ?? null
}

export function splitProjects(projects: Project[]): { active: Project[]; rest: Project[] } {
  const sorted = [...projects].sort((a, b) => a.order - b.order)
  return { active: sorted.filter((p) => p.status === 'active'), rest: sorted.filter((p) => p.status !== 'active') }
}
