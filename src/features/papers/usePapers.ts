import { useCallback } from 'react'
import { useUserCollection } from '../../data/useUserCollection'
import { normalizePaper } from '../../lib/papers'
import type { Paper, PaperStatus } from '../../lib/types'

export type NewPaper = Omit<Paper, 'id' | 'addedAt' | 'readAt'>

export function usePapers() {
  const col = useUserCollection<Paper>('papers', normalizePaper)

  const add = useCallback((p: NewPaper) => {
    const now = new Date().toISOString()
    return col.add({ ...p, addedAt: now, readAt: p.status === 'read' ? now : null })
  }, [col])
  const update = useCallback((id: string, patch: Partial<NewPaper>) => col.update(id, patch), [col])
  const remove = useCallback((id: string) => col.remove(id), [col])
  /** Status change; `read` stamps readAt, anything else clears it. */
  const setStatus = useCallback((id: string, status: PaperStatus) => col.update(id, { status, readAt: status === 'read' ? new Date().toISOString() : null }), [col])

  return { papers: col.items, add, update, remove, setStatus, loading: col.loading }
}
