import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc, writeBatch, type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useUid } from '../features/auth/AuthProvider'

const BATCH = 450

export function useUserCollection<T extends { id: string }>(name: string, normalize: (raw: DocumentData, id: string) => T) {
  const uid = useUid()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const col = useMemo(() => collection(db, 'users', uid, name), [uid, name])

  useEffect(() => {
    setLoading(true)
    return onSnapshot(col, (snap) => {
      setItems(snap.docs.map((d) => normalize(d.data(), d.id)))
      setLoading(false)
    })
    // normalize is expected to be a stable module-level function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col])

  const add = useCallback(async (item: Omit<T, 'id'>) => {
    const ref = await addDoc(col, item as DocumentData)
    return ref.id
  }, [col])

  const update = useCallback(async (id: string, patch: Partial<T>) => {
    await updateDoc(doc(col, id), patch as DocumentData)
  }, [col])

  const remove = useCallback(async (id: string) => {
    await deleteDoc(doc(col, id))
  }, [col])

  /** Write many docs (and optionally delete existing ones) in batches of 450. */
  const setMany = useCallback(async (newItems: Omit<T, 'id'>[], opts?: { deleteIds?: string[] }) => {
    const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = []
    for (const id of opts?.deleteIds ?? []) ops.push((b) => b.delete(doc(col, id)))
    for (const it of newItems) ops.push((b) => b.set(doc(col), it as DocumentData))
    for (let i = 0; i < ops.length; i += BATCH) {
      const b = writeBatch(db)
      ops.slice(i, i + BATCH).forEach((op) => op(b))
      await b.commit()
    }
  }, [col])

  return { items, add, update, remove, setMany, loading }
}
