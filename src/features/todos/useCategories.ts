import { useCallback, useMemo } from 'react'
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useUid } from '../auth/AuthProvider'
import { useUserCollection } from '../../data/useUserCollection'
import { normalizeCategory } from '../../lib/categories'
import type { Category, PaletteColor } from '../../lib/types'

const BATCH = 450

export function useCategories() {
  const uid = useUid()
  const col = useUserCollection<Category>('categories', normalizeCategory)
  const categories = useMemo(() => [...col.items].sort((a, b) => a.order - b.order), [col.items])

  const add = useCallback(async (name: string, color: PaletteColor) => {
    const order = categories.length ? Math.max(...categories.map((c) => c.order)) + 1 : 0
    return col.add({ name: name.trim(), color, order })
  }, [col, categories])

  const update = useCallback((id: string, patch: Partial<Pick<Category, 'name' | 'color'>>) => col.update(id, patch), [col])

  /** Delete a category; todos pointing at it become "other" (categoryId null). */
  const remove = useCallback(async (id: string) => {
    const todos = await getDocs(query(collection(db, 'users', uid, 'todos'), where('categoryId', '==', id)))
    const refs = todos.docs.map((d) => d.ref)
    for (let i = 0; i < refs.length; i += BATCH) {
      const b = writeBatch(db)
      refs.slice(i, i + BATCH).forEach((r) => b.update(r, { categoryId: null }))
      await b.commit()
    }
    const b = writeBatch(db)
    b.delete(doc(db, 'users', uid, 'categories', id))
    await b.commit()
  }, [uid])

  /** Swap order with the neighbour in direction dir. */
  const move = useCallback(async (id: string, dir: -1 | 1) => {
    const i = categories.findIndex((c) => c.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= categories.length) return
    const a = categories[i], b = categories[j]
    const batch = writeBatch(db)
    batch.update(doc(db, 'users', uid, 'categories', a.id), { order: b.order === a.order ? a.order + dir : b.order })
    batch.update(doc(db, 'users', uid, 'categories', b.id), { order: a.order })
    await batch.commit()
  }, [uid, categories])

  return { categories, add, update, remove, move, loading: col.loading }
}
