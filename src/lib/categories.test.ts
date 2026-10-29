import { groupTodos, shouldSeedCategories, OTHER_GROUP_ID, DEFAULT_CATEGORIES } from './categories'
import type { Category, Todo } from './types'

const cat = (id: string, order: number): Category => ({ id, name: id, color: 'sky', order })
const todo = (id: string, categoryId: string | null): Todo => ({ id, title: id, date: '2026-10-29', done: false, doneAt: null, source: null, createdAt: id, categoryId })

describe('groupTodos', () => {
  test('groups by category order, other group last and always present', () => {
    const g = groupTodos([todo('a', 'c2'), todo('b', 'c1'), todo('c', null)], [cat('c1', 0), cat('c2', 1)])
    expect(g.map((x) => x.id)).toEqual(['c1', 'c2', OTHER_GROUP_ID])
    expect(g[0].todos.map((t) => t.id)).toEqual(['b'])
    expect(g[2].todos.map((t) => t.id)).toEqual(['c'])
  })
  test('todo pointing at a deleted category falls into other', () => {
    const g = groupTodos([todo('a', 'gone')], [cat('c1', 0)])
    expect(g.at(-1)!.todos.map((t) => t.id)).toEqual(['a'])
  })
  test('empty categories → only the other group', () => {
    expect(groupTodos([], []).map((x) => x.id)).toEqual([OTHER_GROUP_ID])
  })
})

describe('shouldSeedCategories', () => {
  test('seeds only when loaded, not yet seeded, and empty', () => {
    expect(shouldSeedCategories({ categoriesSeeded: false }, [], false, false)).toBe(true)
    expect(shouldSeedCategories({ categoriesSeeded: true }, [], false, false)).toBe(false)
    expect(shouldSeedCategories({ categoriesSeeded: false }, [cat('x', 0)], false, false)).toBe(false)
    expect(shouldSeedCategories({ categoriesSeeded: false }, [], true, false)).toBe(false)
    expect(shouldSeedCategories({ categoriesSeeded: false }, [], false, true)).toBe(false)
  })
  test('default categories are 공부/연구/대학원', () => {
    expect(DEFAULT_CATEGORIES.map((c) => [c.name, c.color])).toEqual([['공부', 'sky'], ['연구', 'mint'], ['대학원', 'pink']])
  })
})

test('default categories carry fixed ids so seeding twice overwrites instead of duplicating', () => {
  expect(DEFAULT_CATEGORIES.map((c) => c.id)).toEqual(['seed-study', 'seed-research', 'seed-grad'])
})
