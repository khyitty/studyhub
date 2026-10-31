import { useCallback, useMemo } from 'react'
import { collection, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useUid } from '../auth/AuthProvider'
import { useUserCollection } from '../../data/useUserCollection'
import { LEGACY_KIND, OTHER_KIND_ID, normalizeKind, type Kind } from '../../lib/kinds'
import type { Shade } from '../../lib/types'

const BATCH = 450

export function useKinds() {
  const uid = useUid()
  const col = useUserCollection<Kind>('kinds', normalizeKind)
  const kinds = useMemo(() => [...col.items].sort((a, b) => a.order - b.order), [col.items])

  const add = useCallback(async (name: string, shade: Shade) => {
    const next = kinds.length ? Math.max(...kinds.map((k) => k.order)) + 1 : 0
    return col.add({ name: name.trim(), shade, order: next })
  }, [col, kinds])

  /** Idempotent create with a fixed id (seed). */
  const put = useCallback((k: Kind) => {
    const { id, ...data } = k
    return setDoc(doc(db, 'users', uid, 'kinds', id), data)
  }, [uid])

  const update = useCallback((id: string, patch: Partial<Pick<Kind, 'name' | 'shade'>>) => col.update(id, patch), [col])

  /** Delete a kind; its schedule items (and phase-1 items still carrying the legacy value) become "기타". */
  const remove = useCallback(async (id: string) => {
    if (id === OTHER_KIND_ID) throw new Error('cannot delete the fallback kind')
    const values = [id, ...Object.entries(LEGACY_KIND).filter(([, v]) => v === id).map(([k]) => k)]
    const schedule = collection(db, 'users', uid, 'schedule')
    const snaps = await Promise.all(values.map((v) => getDocs(query(schedule, where('kind', '==', v)))))
    const refs = snaps.flatMap((s) => s.docs.map((d) => d.ref))
    for (let i = 0; i < refs.length; i += BATCH) {
      const b = writeBatch(db)
      refs.slice(i, i + BATCH).forEach((r) => b.update(r, { kind: OTHER_KIND_ID }))
      await b.commit()
    }
    const b = writeBatch(db)
    b.delete(doc(db, 'users', uid, 'kinds', id))
    await b.commit()
  }, [uid])

  /** Swap order with the neighbour in direction dir. */
  const move = useCallback(async (id: string, dir: -1 | 1) => {
    const i = kinds.findIndex((k) => k.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= kinds.length) return
    const a = kinds[i], b = kinds[j]
    const batch = writeBatch(db)
    batch.update(doc(db, 'users', uid, 'kinds', a.id), { order: b.order === a.order ? a.order + dir : b.order })
    batch.update(doc(db, 'users', uid, 'kinds', b.id), { order: a.order })
    await batch.commit()
  }, [uid, kinds])

  return { kinds, add, put, update, remove, move, loading: col.loading }
}
