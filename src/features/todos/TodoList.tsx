import { useState, type KeyboardEvent } from 'react'
import { IconCheck, IconPlus, IconTrash } from '../../components/icons'
import { useT } from '../../i18n/useT'
import type { Todo } from '../../lib/types'

type Props = {
  todos: Todo[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (title: string) => Promise<void>
  emptyText?: string
}

function Row({ todo, onToggle, onRemove }: { todo: Todo; onToggle: () => void; onRemove: () => void }) {
  const t = useT()
  const [menu, setMenu] = useState(false)
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.title}
        onClick={onToggle}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${todo.done ? 'border-mint-deep bg-mint-deep text-white' : 'border-line bg-surface'}`}>
          {todo.done && <IconCheck size={14} strokeWidth={3} />}
        </span>
      </button>
      <button type="button" onClick={onToggle} className={`min-w-0 flex-1 py-2 text-left ${todo.done ? 'text-ink-muted line-through' : ''}`}>
        <span className="block break-keep leading-snug">{todo.title}</span>
        {todo.source && <span className="mt-0.5 inline-block rounded-pill bg-lilac px-2 py-0.5 text-[11px] font-semibold text-lilac-deep">{todo.source.label}</span>}
      </button>
      {menu ? (
        <button type="button" onClick={onRemove} aria-label={t('common.delete')}
          className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-pill bg-danger/10 px-3 text-sm font-semibold text-danger">
          <IconTrash size={16} />{t('common.delete')}
        </button>
      ) : (
        <button type="button" onClick={() => setMenu(true)} aria-label="more" onBlur={() => setTimeout(() => setMenu(false), 150)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-muted hover:bg-surface-2">
          <span aria-hidden="true" className="text-lg leading-none">⋯</span>
        </button>
      )}
    </li>
  )
}

export function TodoList({ todos, onToggle, onRemove, onAdd, emptyText }: Props) {
  const t = useT()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!draft.trim() || busy) return
    setBusy(true)
    try { await onAdd(draft); setDraft('') } finally { setBusy(false) }
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); void submit() } }

  return (
    <div>
      {todos.length === 0 && emptyText && <p className="py-3 text-center text-sm text-ink-muted">{emptyText}</p>}
      <ul className="divide-y divide-line">
        {todos.map((todo) => <Row key={todo.id} todo={todo} onToggle={() => onToggle(todo.id)} onRemove={() => onRemove(todo.id)} />)}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={t('home.todoPlaceholder')}
          aria-label={t('home.addTodo')}
          enterKeyHint="done"
          className="min-h-11 flex-1 rounded-pill border border-line bg-surface px-4 text-base placeholder:text-ink-muted/60 focus:border-accent focus:outline-none"
        />
        <button type="button" onClick={() => void submit()} disabled={!draft.trim() || busy} aria-label={t('home.addTodo')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-primary text-on-primary disabled:opacity-40">
          <IconPlus size={20} />
        </button>
      </div>
    </div>
  )
}
