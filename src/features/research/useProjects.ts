import { useCallback, useMemo } from 'react'
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useUid } from '../auth/AuthProvider'
import { useUserCollection } from '../../data/useUserCollection'
import { normalizeProject } from '../../lib/projects'
import type { Project } from '../../lib/types'

const BATCH = 450
export type NewProject = Omit<Project, 'id' | 'createdAt'>

export function useProjects() {
  const uid = useUid()
  const col = useUserCollection<Project>('projects', normalizeProject)
  const projects = useMemo(() => [...col.items].sort((a, b) => a.order - b.order), [col.items])

  /** Linked todos (source.refId === id), for cascading label / unlink updates. */
  const linkedRefs = useCallback(async (id: string) => {
    const snap = await getDocs(query(collection(db, 'users', uid, 'todos'), where('source.refId', '==', id)))
    return snap.docs.map((d) => d.ref)
  }, [uid])

  const batched = useCallback(async (ops: Array<(b: ReturnType<typeof writeBatch>) => void>) => {
    for (let i = 0; i < ops.length; i += BATCH) {
      const b = writeBatch(db)
      ops.slice(i, i + BATCH).forEach((op) => op(b))
      await b.commit()
    }
  }, [])

  const add = useCallback((p: NewProject) => {
    const order = projects.length ? Math.max(...projects.map((x) => x.order)) + 1 : 0
    return col.add({ ...p, name: p.name.trim(), order: p.order ?? order, createdAt: new Date().toISOString() })
  }, [col, projects])

  /** Patch a project; a renamed project rewrites `source.label` on its todos. */
  const update = useCallback(async (id: string, patch: Partial<NewProject>) => {
    const current = col.items.find((p) => p.id === id)
    await col.update(id, patch)
    if (patch.name != null && current && patch.name !== current.name) {
      const refs = await linkedRefs(id)
      await batched(refs.map((r) => (b) => b.update(r, { 'source.label': patch.name })))
    }
  }, [col, linkedRefs, batched])

  /** Delete a project; its todos stay, unlinked (source: null). */
  const remove = useCallback(async (id: string) => {
    const refs = await linkedRefs(id)
    await batched([...refs.map((r) => (b: ReturnType<typeof writeBatch>) => b.update(r, { source: null })), (b) => b.delete(doc(db, 'users', uid, 'projects', id))])
  }, [uid, linkedRefs, batched])

  return { projects, add, update, remove, loading: col.loading }
}
