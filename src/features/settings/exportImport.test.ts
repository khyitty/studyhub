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
    expect(Object.keys(parsed.collections).sort()).toEqual(['categories', 'courses', 'creditCats', 'kinds', 'papers', 'projects', 'schedule', 'schools', 'terms', 'todos'])
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

  test('validateImport leaves absent collections undefined and keeps present-but-empty arrays', () => {
    const data = validateImport(JSON.stringify({ version: EXPORT_VERSION, collections: { terms: [], kinds: [] } }))
    expect(data.collections.terms).toEqual([])
    expect(data.collections.kinds).toEqual([])
    expect(data.collections.creditCats).toBeUndefined()
    expect(data.collections.categories).toBeUndefined()
  })

  test('serialize writes all ten collections', () => {
    const parsed = JSON.parse(serialize({ ...sample, collections: { ...sample.collections, categories: [{ id: 'c', name: '공부' }], schools: [] } } as never))
    expect(Object.keys(parsed.collections).sort()).toEqual(['categories', 'courses', 'creditCats', 'kinds', 'papers', 'projects', 'schedule', 'schools', 'terms', 'todos'])
  })
  test('old phase-1 backup leaves the v2 collections untouched (undefined, not emptied)', () => {
    const data = validateImport(JSON.stringify({ version: EXPORT_VERSION, collections: { terms: [], courses: [], todos: [], schedule: [] } }))
    expect(data.collections.kinds).toBeUndefined()
    expect(data.collections.creditCats).toBeUndefined()
    expect(data.collections.papers).toBeUndefined()
    expect(data.collections.projects).toBeUndefined()
    expect(data.collections.terms).toEqual([])
  })
})
