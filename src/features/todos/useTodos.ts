import { useCallback, useMemo } from 'react'
import type { DocumentData } from 'firebase/firestore'
import { useUserCollection } from '../../data/useUserCollection'
import { useProfile } from '../../data/useProfile'
import { useToast } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { XP_TODO, applyXp, levelFor } from '../../lib/xp'
import { todayISO } from '../../lib/dates'
import type { Todo } from '../../lib/types'

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

export function useTodos() {
  const col = useUserCollection<Todo>('todos', normalizeTodo)
  const { profile, addXp } = useProfile()
  const toast = useToast()
  const t = useT()
  const today = todayISO()

  const todos = useMemo(() => [...col.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [col.items])
  const todayList = useMemo(() => todos.filter((x) => x.date === today), [todos, today])
  const overdue = useMemo(() => todos.filter((x) => x.date < today && !x.done), [todos, today])
  const completionRatio = todayList.length ? todayList.filter((x) => x.done).length / todayList.length : 0

  const add = useCallback(async (title: string, date: string = todayISO()) => {
    const clean = title.trim()
    if (!clean) return
    await col.add({ title: clean, date, done: false, doneAt: null, source: null, createdAt: new Date().toISOString(), categoryId: null })
  }, [col])

  const toggle = useCallback(async (id: string) => {
    const todo = col.items.find((x) => x.id === id)
    if (!todo) return
    const done = !todo.done
    const delta = done ? XP_TODO : -XP_TODO
    // atomic increment: two quick taps or an offline queue never read a stale xp
    await Promise.all([col.update(id, { done, doneAt: done ? new Date().toISOString() : null }), addXp(delta)])
    const before = profile.xp
    const lv = levelFor(applyXp(before, delta))
    if (lv > levelFor(before)) toast.show(t('home.levelUp', { level: lv }))
  }, [col, profile.xp, addXp, toast, t])

  const remove = useCallback((id: string) => col.remove(id), [col])

  const moveOverdueToToday = useCallback(async () => {
    const d = todayISO()
    await Promise.all(overdue.map((x) => col.update(x.id, { date: d })))
  }, [col, overdue])

  return { todos, today: todayList, overdue, add, toggle, remove, moveOverdueToToday, completionRatio, loading: col.loading }
}
