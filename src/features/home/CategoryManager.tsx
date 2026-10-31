import { useState } from 'react'
import { Button, Modal, ShadePick } from '../../components/ui'
import { IconTrash } from '../../components/icons'
import { useT } from '../../i18n/useT'
import type { Category, Shade } from '../../lib/types'
import { useCategories } from '../todos/useCategories'

function Row({ c, first, last, onUpdate, onMove, onRemove }: { c: Category; first: boolean; last: boolean; onUpdate: (p: Partial<Pick<Category, 'name' | 'shade'>>) => void; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const t = useT()
  const [name, setName] = useState(c.name)
  const arrow = 'flex h-8 w-8 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2 disabled:opacity-30'
  return (
    <li className="space-y-2 py-3">
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => { const v = name.trim(); if (v && v !== c.name) onUpdate({ name: v }) }}
          aria-label={t('home.categoryName')} className="min-h-10 min-w-0 flex-1 rounded-card border border-line-strong bg-surface px-3 text-base focus:border-ink focus:outline-none" />
        <button type="button" className={arrow} disabled={first} aria-label="↑" onClick={() => onMove(-1)}>↑</button>
        <button type="button" className={arrow} disabled={last} aria-label="↓" onClick={() => onMove(1)}>↓</button>
        <button type="button" className={`${arrow} text-danger`} aria-label={t('common.delete')} onClick={onRemove}><IconTrash size={16} /></button>
      </div>
      <ShadePick value={c.shade} onChange={(shade) => onUpdate({ shade })} label={t('home.categoryColor')} />
    </li>
  )
}

export function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const { categories, add, update, remove, move } = useCategories()
  const [name, setName] = useState('')
  const [shade, setShade] = useState<Shade>(2)

  const submit = async () => {
    const v = name.trim()
    if (!v) return
    await add(v, shade)
    setName('')
  }

  return (
    <Modal open={open} onClose={onClose} title={t('home.manageCategories')} footer={<Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>}>
      <ul className="divide-y divide-line">
        {categories.map((c, i) => (
          <Row key={c.id} c={c} first={i === 0} last={i === categories.length - 1}
            onUpdate={(p) => void update(c.id, p)} onMove={(d) => void move(c.id, d)}
            onRemove={() => { if (window.confirm(t('home.deleteCategoryConfirm'))) void remove(c.id) }} />
        ))}
      </ul>
      <div className="mt-2 space-y-2 border-t border-line-strong pt-4">
        <p className="text-xs font-bold text-ink-muted">{t('home.addCategory')}</p>
        <div className="flex items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submit() } }}
            placeholder={t('home.categoryName')} aria-label={t('home.categoryName')}
            className="min-h-10 min-w-0 flex-1 rounded-card border border-line-strong bg-surface px-3 text-base placeholder:text-ink-faint focus:border-ink focus:outline-none" />
          <Button size="sm" onClick={() => void submit()} disabled={!name.trim()}>{t('common.add')}</Button>
        </div>
        <ShadePick value={shade} onChange={setShade} label={t('home.categoryColor')} />
      </div>
    </Modal>
  )
}
