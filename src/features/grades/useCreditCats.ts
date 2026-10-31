import { useCallback, useMemo } from 'react'
import { doc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useUid } from '../auth/AuthProvider'
import { useUserCollection } from '../../data/useUserCollection'
import { normalizeCreditCat, renamePlan, type CreditCat, type NewCreditCat } from '../../lib/creditCats'
import type { Course } from '../../lib/types'

const BATCH = 450

export function useCreditCats() {
  const uid = useUid()
  const col = useUserCollection<CreditCat>('creditCats', normalizeCreditCat)
  const cats = useMemo(() => [...col.items].sort((a, b) => a.order - b.order), [col.items])

  const add = useCallback((c: NewCreditCat) => col.add({ ...c, name: c.name.trim() }), [col])

  /** Idempotent create with a fixed id (seed). */
  const put = useCallback((c: CreditCat) => {
    const { id, ...data } = c
    return setDoc(doc(db, 'users', uid, 'creditCats', id), data)
  }, [uid])

  const update = useCallback((id: string, patch: Partial<Pick<CreditCat, 'required' | 'isMajor'>>) => col.update(id, patch), [col])

  /** Rename a row: old name becomes an alias, its courses are rewritten to the new name (one batch per 450 docs). */
  const rename = useCallback(async (cat: CreditCat, newName: string, courses: Course[]) => {
    const clean = newName.trim()
    if (!clean || clean === cat.name) return
    const { catPatch, courseIds } = renamePlan(cat, clean, courses)
    const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [(b) => b.update(doc(db, 'users', uid, 'creditCats', cat.id), catPatch)]
    for (const id of courseIds) ops.push((b) => b.update(doc(db, 'users', uid, 'courses', id), { category: clean }))
    for (let i = 0; i < ops.length; i += BATCH) {
      const b = writeBatch(db)
      ops.slice(i, i + BATCH).forEach((op) => op(b))
      await b.commit()
    }
  }, [uid])

  /** Delete a row; courses keep their category and show under "기타" until a matching row exists again. */
  const remove = useCallback((id: string) => col.remove(id), [col])

  /** Swap order with the neighbour in direction dir. */
  const move = useCallback(async (id: string, dir: -1 | 1) => {
    const i = cats.findIndex((c) => c.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= cats.length) return
    const a = cats[i], b = cats[j]
    const batch = writeBatch(db)
    batch.update(doc(db, 'users', uid, 'creditCats', a.id), { order: b.order === a.order ? a.order + dir : b.order })
    batch.update(doc(db, 'users', uid, 'creditCats', b.id), { order: a.order })
    await batch.commit()
  }, [uid, cats])

  return { cats, add, put, update, rename, remove, move, loading: col.loading }
}
