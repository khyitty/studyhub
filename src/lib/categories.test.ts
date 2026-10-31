import { groupTodos, shouldSeedCategories, normalizeCategory, OTHER_GROUP_ID, DEFAULT_CATEGORIES } from './categories'
import type { Category, Todo } from './types'

const cat = (id: string, order: number): Category => ({ id, name: id, shade: 2, order })
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
  test('default categories: 공부 2, 연구 3, 대학원 4', () => {
    expect(DEFAULT_CATEGORIES.map((c) => [c.name, c.shade])).toEqual([['공부', 2], ['연구', 3], ['대학원', 4]])
  })
})

test('default categories carry fixed ids so seeding twice overwrites instead of duplicating', () => {
  expect(DEFAULT_CATEGORIES.map((c) => c.id)).toEqual(['seed-study', 'seed-research', 'seed-grad'])
})

test('normalizeCategory: legacy color → shade, numeric shade kept, junk → 2', () => {
  expect(normalizeCategory({ name: 'a', color: 'mint', order: 0 }, 'x').shade).toBe(3)
  expect(normalizeCategory({ name: 'a', shade: 6, order: 0 }, 'x').shade).toBe(6)
  expect(normalizeCategory({ name: 'a', color: 'red', order: 0 }, 'x').shade).toBe(2)
  expect(normalizeCategory({ name: 'a', shade: 9, order: 0 }, 'x').shade).toBe(2)
})
