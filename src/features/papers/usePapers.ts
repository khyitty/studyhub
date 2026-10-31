import { useCallback } from 'react'
import { useUserCollection } from '../../data/useUserCollection'
import { normalizePaper, withReadAt } from '../../lib/papers'
import type { Paper, PaperStatus } from '../../lib/types'

export type NewPaper = Omit<Paper, 'id' | 'addedAt' | 'readAt'>

export function usePapers() {
  const col = useUserCollection<Paper>('papers', normalizePaper)

  const add = useCallback((p: NewPaper) => {
    const now = new Date().toISOString()
    return col.add({ ...p, addedAt: now, readAt: p.status === 'read' ? now : null })
  }, [col])
  /** Any edit; a status change inside it stamps/clears readAt like setStatus. */
  const update = useCallback((id: string, patch: Partial<NewPaper>) => {
    const current = col.items.find((p) => p.id === id)
    return col.update(id, current ? withReadAt(patch, current.status, new Date().toISOString()) : patch)
  }, [col])
  const remove = useCallback((id: string) => col.remove(id), [col])
  const setStatus = useCallback((id: string, status: PaperStatus) => update(id, { status }), [update])

  return { papers: col.items, add, update, remove, setStatus, loading: col.loading }
}
