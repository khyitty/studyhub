import { serialize, validateImport, EXPORT_VERSION } from './exportImport'

const sample = {
  profile: { lang: 'ko', xp: 30 },
  collections: { terms: [{ id: 't1', code: '2024-1' }], courses: [], todos: [{ id: 'a', title: 'x' }], schedule: [] },
}

describe('exportImport', () => {
  test('serialize produces versioned JSON with exportedAt and all collections', () => {
    const json = serialize(sample as never)
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(EXPORT_VERSION)
    expect(typeof parsed.exportedAt).toBe('string')
    expect(parsed.profile.xp).toBe(30)
    expect(parsed.collections.terms).toHaveLength(1)
    expect(Object.keys(parsed.collections).sort()).toEqual(['categories', 'courses', 'schedule', 'schools', 'terms', 'todos'])
  })

  test('validateImport round-trips serialized data', () => {
    const data = validateImport(serialize(sample as never))
    expect(data.collections.todos[0].title).toBe('x')
    expect(data.profile.lang).toBe('ko')
  })

  test('validateImport throws on version mismatch', () => {
    expect(() => validateImport(JSON.stringify({ version: 99, collections: {} }))).toThrow(/version/)
  })

  test('validateImport throws on invalid JSON or missing collections', () => {
    expect(() => validateImport('not json')).toThrow()
    expect(() => validateImport(JSON.stringify({ version: EXPORT_VERSION }))).toThrow(/collections/)
  })

  test('validateImport fills missing collections with empty arrays', () => {
    const data = validateImport(JSON.stringify({ version: EXPORT_VERSION, collections: { terms: [] } }))
    expect(data.collections.courses).toEqual([])
    expect(data.collections.todos).toEqual([])
  })

  test('serialize includes categories and schools', () => {
    const parsed = JSON.parse(serialize({ ...sample, collections: { ...sample.collections, categories: [{ id: 'c', name: '공부' }], schools: [] } } as never))
    expect(Object.keys(parsed.collections).sort()).toEqual(['categories', 'courses', 'schedule', 'schools', 'terms', 'todos'])
  })
  test('old backup without categories/schools still imports with empty arrays', () => {
    const data = validateImport(JSON.stringify({ version: EXPORT_VERSION, collections: { terms: [], courses: [], todos: [], schedule: [] } }))
    expect(data.collections.categories).toEqual([])
    expect(data.collections.schools).toEqual([])
  })
})
