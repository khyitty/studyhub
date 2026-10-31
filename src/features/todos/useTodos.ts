import { useCallback, useMemo } from 'react'
import type { DocumentData } from 'firebase/firestore'
import { useUserCollection } from '../../data/useUserCollection'
import { todayISO } from '../../lib/dates'
import type { Todo } from '../../lib/types'
import { completion, newTodoDoc, todosOn } from './todos'

export type { Todo }

export function normalizeTodo(raw: DocumentData, id: string): Todo {
  return {
    id,
    title: String(raw.title ?? ''),
    date: String(raw.date ?? todayISO()),
    done: Boolean(raw.done),
    doneAt: raw.doneAt ? String(raw.doneAt) : null,
    source: raw.source && typeof raw.source === 'object'
      ? { type: raw.source.type ?? 'general', refId: raw.source.refId ?? null, label: String(raw.source.label ?? '') }
      : null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    categoryId: raw.categoryId ? String(raw.categoryId) : null,
  }
}

/** @param selectedDate drives `selected`/`selectedStats`; `today`/`completionRatio` always use today (confetti). */
export function useTodos(selectedDate: string = todayISO()) {
  const col = useUserCollection<Todo>('todos', normalizeTodo)
  const today = todayISO()

  const todos = useMemo(() => [...col.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [col.items])
  const todayList = useMemo(() => todos.filter((x) => x.date === today), [todos, today])
  const overdue = useMemo(() => todos.filter((x) => x.date < today && !x.done), [todos, today])
  const completionRatio = todayList.length ? todayList.filter((x) => x.done).length / todayList.length : 0
  const selected = useMemo(() => todosOn(todos, selectedDate), [todos, selectedDate])
  const selectedStats = useMemo(() => completion(selected), [selected])

  const add = useCallback(async (title: string, opts?: { categoryId?: string | null; date?: string; source?: Todo['source'] }) => {
    const docData = newTodoDoc(title, selectedDate, opts)
    if (!docData) return
    await col.add(docData)
  }, [col, selectedDate])

  const update = useCallback((id: string, patch: Partial<Pick<Todo, 'title' | 'categoryId' | 'date'>>) => col.update(id, patch), [col])

  const toggle = useCallback(async (id: string) => {
    const todo = col.items.find((x) => x.id === id)
    if (!todo) return
    const done = !todo.done
    await col.update(id, { done, doneAt: done ? new Date().toISOString() : null })
  }, [col])

  const remove = useCallback((id: string) => col.remove(id), [col])

  const moveOverdueToToday = useCallback(async () => {
    const d = todayISO()
    await Promise.all(overdue.map((x) => col.update(x.id, { date: d })))
  }, [col, overdue])

  return { todos, today: todayList, overdue, selected, selectedStats, add, update, toggle, remove, moveOverdueToToday, completionRatio, loading: col.loading }
}
