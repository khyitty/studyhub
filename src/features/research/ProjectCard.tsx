import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Card, Tag } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { STATUS_TONE } from '../../lib/projects'
import type { Category, Project, ProjectStatus, Shade, Todo } from '../../lib/types'
import { AddTodoRow } from '../todos/AddTodoRow'
import { TodoRow } from '../todos/TodoRow'

type TodoPatch = Partial<Pick<Todo, 'title' | 'categoryId' | 'date'>>

type Props = {
  project: Project
  todos: Todo[]
  shade: Shade | null
  categories: Category[]
  onAddTodo: (title: string) => Promise<void>
  onToggle: (id: string) => void
  onUpdateTodo: (id: string, patch: TodoPatch) => void
  onRemoveTodo: (id: string) => void
  onGoal: (goal: string) => void
  onEdit: () => void
  onSetStatus: (s: ProjectStatus) => void
  onDelete: () => void
}

const menuItem = 'flex min-h-10 w-full items-center px-3 text-left text-sm hover:bg-surface-2'

function Goal({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])
  const commit = () => { const v = draft.trim(); if (v !== value) onSave(v); setEditing(false) }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
  }
  if (editing) {
    return <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} aria-label={placeholder}
      className="min-h-9 w-full border-b border-ink bg-transparent text-base focus:outline-none" />
  }
  return (
    <button type="button" onClick={() => setEditing(true)} className={`min-h-9 w-full text-left text-sm leading-snug break-keep ${value ? '' : 'text-ink-faint'}`}>
      {value || placeholder}
    </button>
  )
}

export function ProjectCard({ project, todos, shade, categories, onAddTodo, onToggle, onUpdateTodo, onRemoveTodo, onGoal, onEdit, onSetStatus, onDelete }: Props) {
  const t = useT()
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    if (!menu) return
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu])
  const act = (fn: () => void) => () => { setMenu(false); fn() }

  return (
    <Card bordered>
      <header className="relative flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug break-keep">{project.name} <Tag tone={STATUS_TONE[project.status]} className="ml-1 align-middle">{t(`research.s_${project.status}`)}</Tag></h3>
          <p className="mt-1 text-[11px] font-bold text-ink-muted">{t('research.goal')}</p>
          <Goal value={project.goal} onSave={onGoal} placeholder={t('research.goalPlaceholder')} />
        </div>
        <button type="button" aria-label="more" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2">
          <span aria-hidden="true" className="text-base leading-none">⋯</span>
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} aria-hidden="true" />
            <div role="menu" className="absolute right-0 top-9 z-40 min-w-44 rounded-card border border-line-strong bg-surface py-1 shadow-soft">
              <button type="button" role="menuitem" className={menuItem} onClick={act(onEdit)}>{t('common.edit')}</button>
              {project.status === 'active'
                ? <button type="button" role="menuitem" className={menuItem} onClick={act(() => onSetStatus('paused'))}>{t('research.pause')}</button>
                : <button type="button" role="menuitem" className={menuItem} onClick={act(() => onSetStatus('active'))}>{t('research.resume')}</button>}
              {project.status !== 'done' && <button type="button" role="menuitem" className={menuItem} onClick={act(() => onSetStatus('done'))}>{t('research.finish')}</button>}
              <button type="button" role="menuitem" className={`${menuItem} text-danger`} onClick={act(onDelete)}>{t('common.delete')}</button>
            </div>
          </>
        )}
      </header>

      {project.note && <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">{project.note}</p>}

      <div className="mt-3">
        <p className="text-[11px] font-bold text-ink-muted">{t('research.nextTodos')} <span className="ml-1 tabular-nums">{todos.length}</span></p>
        <ul className="mt-1">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} shade={shade} categories={categories} hideSource
              onToggle={() => onToggle(todo.id)} onUpdate={(p) => onUpdateTodo(todo.id, p)} onRemove={() => onRemoveTodo(todo.id)} />
          ))}
          <AddTodoRow onAdd={onAddTodo} label={t('research.addTodo')} />
        </ul>
      </div>
    </Card>
  )
}
