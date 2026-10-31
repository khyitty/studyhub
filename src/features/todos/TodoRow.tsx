import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { IconCheck } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { SHADE_CLASS, textShade } from '../../lib/theme'
import type { Category, Shade, Todo } from '../../lib/types'

type Patch = Partial<Pick<Todo, 'title' | 'categoryId' | 'date'>>

type Props = {
  todo: Todo
  shade: Shade | null
  categories: Category[]
  onToggle: () => void
  onUpdate: (patch: Patch) => void
  onRemove: () => void
}

type Menu = 'closed' | 'main' | 'category' | 'date'

const menuItem = 'flex min-h-10 w-full items-center px-3 text-left text-sm hover:bg-surface-2'

export function TodoRow({ todo, shade, categories, onToggle, onUpdate, onRemove }: Props) {
  const t = useT()
  const [menu, setMenu] = useState<Menu>('closed')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  useEffect(() => {
    if (menu === 'closed') return
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setMenu('closed') }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu])

  // filled box uses the shade itself; the thin outline uses the lifted text shade so light shades stay visible
  const box = todo.done
    ? shade ? `${SHADE_CLASS[shade].fill} ${SHADE_CLASS[shade].on}` : 'bg-ink-faint text-white'
    : `border-[1.5px] bg-transparent ${shade ? SHADE_CLASS[textShade(shade)].border : 'border-line-strong'}`

  const commitTitle = () => {
    const clean = draft.trim()
    if (clean && clean !== todo.title) onUpdate({ title: clean })
    setEditing(false)
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
    if (e.key === 'Escape') { setDraft(todo.title); setEditing(false) }
  }

  return (
    <li className="group relative flex items-center gap-2.5 py-1">
      <button type="button" role="checkbox" aria-checked={todo.done} aria-label={todo.title} onClick={onToggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center md:h-7 md:w-7">
        <span className={`flex h-[17px] w-[17px] items-center justify-center rounded-[3px] transition ${box}`}>
          {todo.done && <IconCheck size={11} strokeWidth={3} />}
        </span>
      </button>
      {editing ? (
        <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commitTitle} onKeyDown={onKey}
          aria-label={t('common.edit')} className="min-h-9 min-w-0 flex-1 border-b border-ink bg-transparent text-base focus:outline-none" />
      ) : (
        <button type="button" onClick={onToggle} className={`min-w-0 flex-1 py-1 text-left text-sm leading-snug break-keep ${todo.done ? 'text-ink-faint line-through' : ''}`}>
          {todo.title}
        </button>
      )}
      <button type="button" aria-label="more" aria-haspopup="menu" aria-expanded={menu !== 'closed'}
        onClick={() => setMenu(menu === 'closed' ? 'main' : 'closed')}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-ink-muted transition hover:bg-surface-2 md:h-7 md:w-7 ${menu !== 'closed' ? 'opacity-100' : 'opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'}`}>
        <span aria-hidden="true" className="text-base leading-none">⋯</span>
      </button>

      {menu !== 'closed' && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenu('closed')} aria-hidden="true" />
          <div role="menu" className="absolute right-0 top-full z-40 min-w-44 rounded-card border border-line-strong bg-surface py-1 shadow-soft">
            {menu === 'main' && (
              <>
                <button type="button" role="menuitem" className={menuItem} onClick={() => { setMenu('closed'); setDraft(todo.title); setEditing(true) }}>{t('common.edit')}</button>
                <button type="button" role="menuitem" className={menuItem} onClick={() => setMenu('category')}>{t('home.changeCategory')}</button>
                <button type="button" role="menuitem" className={menuItem} onClick={() => setMenu('date')}>{t('home.moveDate')}</button>
                <button type="button" role="menuitem" className={`${menuItem} text-danger`} onClick={() => { setMenu('closed'); onRemove() }}>{t('common.delete')}</button>
              </>
            )}
            {menu === 'category' && (
              <>
                {categories.map((c) => (
                  <button key={c.id} type="button" role="menuitemradio" aria-checked={todo.categoryId === c.id} className={`${menuItem} gap-2`}
                    onClick={() => { onUpdate({ categoryId: c.id }); setMenu('closed') }}>
                    <span className={`h-2.5 w-2.5 rounded-[2px] ${SHADE_CLASS[c.shade].fill}`} />{c.name}
                  </button>
                ))}
                <button type="button" role="menuitemradio" aria-checked={todo.categoryId === null} className={`${menuItem} gap-2`}
                  onClick={() => { onUpdate({ categoryId: null }); setMenu('closed') }}>
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-ink-faint" />{t('home.other')}
                </button>
              </>
            )}
            {menu === 'date' && (
              <div className="px-3 py-2">
                <input type="date" defaultValue={todo.date} aria-label={t('home.moveDate')}
                  onChange={(e) => { if (e.target.value) { onUpdate({ date: e.target.value }); setMenu('closed') } }}
                  className="min-h-9 w-full rounded-card border border-line-strong bg-surface px-2 text-base" />
              </div>
            )}
          </div>
        </>
      )}
    </li>
  )
}
