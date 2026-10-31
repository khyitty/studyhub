import { completion, newTodoDoc, todosOn } from './todos'
import type { Todo } from '../../lib/types'
const t = (id: string, date: string, done = false): Todo => ({ id, title: id, date, done, doneAt: null, source: null, createdAt: id, categoryId: null })

test('todosOn filters by date keeping createdAt order', () => {
  expect(todosOn([t('b', '2026-10-30'), t('a', '2026-10-30'), t('c', '2026-10-29')], '2026-10-30').map((x) => x.id)).toEqual(['a', 'b'])
})
test('completion counts done over total; empty is 0', () => {
  expect(completion([t('a', 'd', true), t('b', 'd')])).toEqual({ done: 1, total: 2, ratio: 0.5 })
  expect(completion([])).toEqual({ done: 0, total: 0, ratio: 0 })
})
test('newTodoDoc defaults date to the selected date and category to null', () => {
  expect(newTodoDoc(' 과제 ', '2026-11-03')).toMatchObject({ title: '과제', date: '2026-11-03', categoryId: null, done: false, doneAt: null, source: null })
  expect(newTodoDoc('x', '2026-11-03', { categoryId: 'c1', date: '2026-11-05' })).toMatchObject({ categoryId: 'c1', date: '2026-11-05' })
  expect(newTodoDoc('   ', '2026-11-03')).toBeNull()
})

test('newTodoDoc carries a project source when given one', () => {
  const source = { type: 'project' as const, refId: 'p1', label: 'P' }
  expect(newTodoDoc('x', '2026-10-31', { source })?.source).toEqual(source)
  expect(newTodoDoc('x', '2026-10-31')?.source).toBeNull()
})
