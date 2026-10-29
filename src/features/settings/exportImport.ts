import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import type { Profile } from '../../data/useProfile'
import type { Course, ScheduleItem, Term, Todo } from '../../lib/types'

export const EXPORT_VERSION = 1
export const COLLECTIONS = ['terms', 'courses', 'todos', 'schedule'] as const
type CollectionName = (typeof COLLECTIONS)[number]

export interface ExportData {
  version: number
  exportedAt: string
  profile: Partial<Profile>
  collections: { terms: Term[]; courses: Course[]; todos: Todo[]; schedule: ScheduleItem[] }
}

type Payload = Pick<ExportData, 'profile' | 'collections'>

export function serialize(data: Payload): string {
  const out: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: data.profile,
    collections: {
      terms: data.collections.terms ?? [],
      courses: data.collections.courses ?? [],
      todos: data.collections.todos ?? [],
      schedule: data.collections.schedule ?? [],
    },
  }
  return JSON.stringify(out, null, 2)
}

export function validateImport(json: string): ExportData {
  const raw = JSON.parse(json) as Partial<ExportData>
  if (raw.version !== EXPORT_VERSION) throw new Error(`Unsupported version: ${String(raw.version)}`)
  if (!raw.collections || typeof raw.collections !== 'object') throw new Error('Missing collections')
  const c = raw.collections as Partial<ExportData['collections']>
  return {
    version: EXPORT_VERSION,
    exportedAt: raw.exportedAt ?? new Date().toISOString(),
    profile: raw.profile ?? {},
    collections: {
      terms: Array.isArray(c.terms) ? c.terms : [],
      courses: Array.isArray(c.courses) ? c.courses : [],
      todos: Array.isArray(c.todos) ? c.todos : [],
      schedule: Array.isArray(c.schedule) ? c.schedule : [],
    },
  }
}

export async function exportAll(uid: string): Promise<Blob> {
  const profileSnap = await getDoc(doc(db, 'users', uid))
  const collections = {} as ExportData['collections']
  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', uid, name))
    ;(collections as Record<CollectionName, unknown[]>)[name] = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
  }
  const json = serialize({ profile: (profileSnap.data() as Partial<Profile>) ?? {}, collections })
  return new Blob([json], { type: 'application/json' })
}

/** Replace all user data with the imported snapshot (profile merged, collections overwritten). */
export async function importAll(uid: string, json: string): Promise<void> {
  const data = validateImport(json)
  const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = []
  if (Object.keys(data.profile).length) ops.push((b) => b.set(doc(db, 'users', uid), data.profile, { merge: true }))
  for (const name of COLLECTIONS) {
    const col = collection(db, 'users', uid, name)
    const existing = await getDocs(col)
    for (const d of existing.docs) ops.push((b) => b.delete(d.ref))
    for (const item of data.collections[name] as Array<{ id?: string }>) {
      const { id, ...rest } = item
      ops.push((b) => b.set(id ? doc(col, id) : doc(col), rest))
    }
  }
  for (let i = 0; i < ops.length; i += 450) {
    const b = writeBatch(db)
    ops.slice(i, i + 450).forEach((op) => op(b))
    await b.commit()
  }
}
