import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import type { Profile } from '../../data/useProfile'
import type { CreditCat } from '../../lib/creditCats'
import type { Kind } from '../../lib/kinds'
import type { Category, Course, Paper, Project, ScheduleItem, School, Term, Todo } from '../../lib/types'

export const EXPORT_VERSION = 1
export const COLLECTIONS = ['terms', 'courses', 'todos', 'schedule', 'categories', 'schools', 'creditCats', 'kinds', 'papers', 'projects'] as const
type CollectionName = (typeof COLLECTIONS)[number]

type Collections = {
  terms: Term[]; courses: Course[]; todos: Todo[]; schedule: ScheduleItem[]; categories: Category[]; schools: School[]
  creditCats: CreditCat[]; kinds: Kind[]; papers: Paper[]; projects: Project[]
}

export interface ExportData {
  version: number
  exportedAt: string
  profile: Partial<Profile>
  /** a key missing from the file means "leave that collection alone" on import */
  collections: Partial<Collections>
}

type Payload = Pick<ExportData, 'profile' | 'collections'>

export function serialize(data: Payload): string {
  const collections = {} as Record<CollectionName, unknown[]>
  for (const name of COLLECTIONS) collections[name] = data.collections[name] ?? []
  const out: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: data.profile,
    collections: collections as Collections,
  }
  return JSON.stringify(out, null, 2)
}

/** Parses a backup. Collections absent from the file come back `undefined` (not `[]`) so importAll can skip them. */
export function validateImport(json: string): ExportData {
  const raw = JSON.parse(json) as Partial<ExportData>
  if (raw.version !== EXPORT_VERSION) throw new Error(`Unsupported version: ${String(raw.version)}`)
  if (!raw.collections || typeof raw.collections !== 'object') throw new Error('Missing collections')
  const c = raw.collections as Record<string, unknown>
  const collections: Partial<Record<CollectionName, unknown[]>> = {}
  for (const name of COLLECTIONS) if (Array.isArray(c[name])) collections[name] = c[name] as unknown[]
  return {
    version: EXPORT_VERSION,
    exportedAt: raw.exportedAt ?? new Date().toISOString(),
    profile: raw.profile ?? {},
    collections: collections as Partial<Collections>,
  }
}

export async function exportAll(uid: string): Promise<Blob> {
  const profileSnap = await getDoc(doc(db, 'users', uid))
  const collections = {} as Record<CollectionName, unknown[]>
  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', uid, name))
    collections[name] = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
  }
  const json = serialize({ profile: (profileSnap.data() as Partial<Profile>) ?? {}, collections: collections as Collections })
  return new Blob([json], { type: 'application/json' })
}

/** Replace the collections present in the file (profile merged); collections missing from the file are left untouched. */
export async function importAll(uid: string, json: string): Promise<void> {
  const data = validateImport(json)
  const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = []
  if (Object.keys(data.profile).length) ops.push((b) => b.set(doc(db, 'users', uid), data.profile, { merge: true }))
  for (const name of COLLECTIONS) {
    const items = data.collections[name] as Array<{ id?: string }> | undefined
    if (!items) continue
    const col = collection(db, 'users', uid, name)
    const existing = await getDocs(col)
    for (const d of existing.docs) ops.push((b) => b.delete(d.ref))
    for (const item of items) {
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
