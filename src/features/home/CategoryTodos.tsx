import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useT } from '../../i18n/useT'
import type { TodoGroup } from '../../lib/categories'
import { SHADE_CLASS, textShade } from '../../lib/theme'
import { formatShortDate } from '../../lib/dates'
import type { Category, Todo } from '../../lib/types'
import { TodoRow } from '../todos/TodoRow'

type Props = {
  groups: TodoGroup[]
  categories: Category[]
  selected: string
  isToday: boolean
  stats: { done: number; total: number }
  onToggle: (id: string) => void
  onAdd: (title: string, categoryId: string | null) => Promise<void>
  onUpdate: (id: string, patch: Partial<Pick<Todo, 'title' | 'categoryId' | 'date'>>) => void
  onRemove: (id: string) => void
  onManage: () => void
}

function AddRow({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) ref.current?.focus() }, [open])

  const cancel = () => { setDraft(''); setOpen(false) }
  const submit = async () => {
    const clean = draft.trim()
    if (!clean) { cancel(); return }
    await onAdd(clean)
    setDraft('')
    ref.current?.focus()
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); void submit() }
    if (e.key === 'Escape') cancel()
  }

  return (
    <li className="flex items-center gap-2.5 py-1">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center md:h-7 md:w-7">
        <span className="h-[17px] w-[17px] rounded-[3px] border-[1.5px] border-dashed border-line-strong" />
      </span>
      {open ? (
        <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={() => { if (!draft.trim()) cancel() }}
          placeholder={t('home.todoPlaceholder')} aria-label={t('home.addTodoHere')} enterKeyHint="done"
          className="min-h-9 min-w-0 flex-1 border-b border-ink bg-transparent text-base placeholder:text-ink-faint focus:outline-none" />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="min-h-9 flex-1 text-left text-sm text-ink-faint hover:text-ink-muted md:min-h-7">
          {t('home.addTodoHere')}
        </button>
      )}
    </li>
  )
}

export function CategoryTodos({ groups, categories, selected, isToday, stats, onToggle, onAdd, onUpdate, onRemove, onManage }: Props) {
  const t = useT()
  const title = isToday ? t('home.todayTodos') : `${formatShortDate(selected)} ${t('home.todos')}`
  return (
    <section>
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold">
          {title} <span className="ml-1 font-semibold text-ink-muted tabular-nums">{stats.done} / {stats.total}</span>
        </h2>
        <button type="button" onClick={onManage} aria-label={t('home.manageCategories')}
          className="flex h-9 w-9 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2">
          <span aria-hidden="true" className="text-base leading-none">⋯</span>
        </button>
      </header>
      <div className="mt-2 space-y-5">
        {groups.map((g) => {
          const shade = g.category?.shade ?? null
          const label = g.category ? g.category.name : t('home.other')
          return (
            <div key={g.id}>
              <h3 className={`text-xs font-bold ${shade ? SHADE_CLASS[textShade(shade)].text : 'text-ink-muted'}`}>{label}</h3>
              <ul className="mt-1">
                {g.todos.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} shade={shade} categories={categories}
                    onToggle={() => onToggle(todo.id)} onUpdate={(p) => onUpdate(todo.id, p)} onRemove={() => onRemove(todo.id)} />
                ))}
                <AddRow onAdd={(title) => onAdd(title, g.category?.id ?? null)} />
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
