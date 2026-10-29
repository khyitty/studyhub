import { useCallback } from 'react'
import { useUserCollection } from '../../data/useUserCollection'
import { normalizeSchool } from '../../lib/schools'
import type { School } from '../../lib/types'

export type NewSchool = Omit<School, 'id' | 'createdAt'>

export function useSchools() {
  const col = useUserCollection<School>('schools', normalizeSchool)

  const add = useCallback((s: NewSchool) => col.add({ ...s, createdAt: new Date().toISOString() }), [col])
  const update = useCallback((id: string, patch: Partial<NewSchool>) => col.update(id, patch), [col])
  const remove = useCallback((id: string) => col.remove(id), [col])

  return { schools: col.items, add, update, remove, loading: col.loading }
}
