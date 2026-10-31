import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useT } from '../../i18n/useT'

/** Dashed-box inline "add a todo" row shared by the home groups and the research board. */
export function AddTodoRow({ onAdd, label }: { onAdd: (title: string) => Promise<void>; label?: string }) {
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
          placeholder={t('home.todoPlaceholder')} aria-label={label ?? t('home.addTodoHere')} enterKeyHint="done"
          className="min-h-9 min-w-0 flex-1 border-b border-ink bg-transparent text-base placeholder:text-ink-faint focus:outline-none" />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="min-h-9 flex-1 text-left text-sm text-ink-faint hover:text-ink-muted md:min-h-7">
          {label ?? t('home.addTodoHere')}
        </button>
      )}
    </li>
  )
}
