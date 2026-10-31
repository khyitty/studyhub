import { STATUS_TONE, normalizeProject, projectTodos, researchCategoryId, splitProjects } from './projects'
import type { ProjectStatus, Todo } from './types'

const td = (id: string, refId: string | null, done = false, createdAt = id): Todo => ({
  id, title: id, date: '2026-10-31', done, doneAt: null, createdAt, categoryId: null,
  source: refId ? { type: 'project', refId, label: 'P' } : null,
})

test('projectTodos: only open todos linked to this project, oldest first', () => {
  expect(projectTodos([td('b', 'p1'), td('a', 'p1'), td('c', 'p2'), td('d', 'p1', true), td('e', null)], 'p1').map((x) => x.id)).toEqual(['a', 'b'])
})

test('researchCategoryId finds 연구/Research, else null', () => {
  const cat = (id: string, name: string) => ({ id, name, shade: 3 as const, order: 0 })
  expect(researchCategoryId([cat('a', '공부'), cat('b', '연구')])).toBe('b')
  expect(researchCategoryId([cat('a', 'Research')])).toBe('a')
  expect(researchCategoryId([cat('a', '공부')])).toBeNull()
})

test('splitProjects: active first list, paused/done in rest, both by order', () => {
  const p = (id: string, status: ProjectStatus, order: number) => normalizeProject({ name: id, status, order }, id)
  const { active, rest } = splitProjects([p('x', 'done', 0), p('b', 'active', 2), p('a', 'active', 1), p('y', 'paused', 1)])
  expect(active.map((q) => q.id)).toEqual(['a', 'b'])
  expect(rest.map((q) => q.id)).toEqual(['x', 'y'])
})

test('normalizeProject defaults', () => {
  expect(normalizeProject({}, 'p')).toMatchObject({ id: 'p', name: '', goal: '', status: 'active', note: '', order: 0 })
})

test('status tones', () => {
  expect(STATUS_TONE).toEqual({ active: 'ok', paused: 'warn', done: 'none' })
})
