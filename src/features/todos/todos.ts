import type { Todo } from '../../lib/types'

/** Todos dated `iso`, oldest first. */
export function todosOn(todos: Todo[], iso: string): Todo[] {
  return todos.filter((x) => x.date === iso).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function completion(list: Todo[]): { done: number; total: number; ratio: number } {
  const total = list.length
  const done = list.filter((x) => x.done).length
  return { done, total, ratio: total ? done / total : 0 }
}

/** Builds a new todo document; null when the title is blank. Date defaults to the selected date, not today. */
export function newTodoDoc(title: string, selectedDate: string, opts?: { categoryId?: string | null; date?: string }): Omit<Todo, 'id'> | null {
  const clean = title.trim()
  if (!clean) return null
  return {
    title: clean,
    date: opts?.date ?? selectedDate,
    done: false,
    doneAt: null,
    source: null,
    createdAt: new Date().toISOString(),
    categoryId: opts?.categoryId ?? null,
  }
}
