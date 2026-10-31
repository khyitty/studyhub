import { useEffect, useState } from 'react'
import { Button, Input, Modal } from '../../components/ui'
import { useT } from '../../i18n/useT'
import type { CreditCat } from '../../lib/creditCats'

export type RowPatch = { name: string; required: number; isMajor: boolean }

type Props = {
  open: boolean
  onClose: () => void
  /** null = adding a new row */
  cat: CreditCat | null
  first: boolean
  last: boolean
  onSave: (patch: RowPatch) => Promise<void>
  onMove: (dir: -1 | 1) => void
  onDelete: () => Promise<void>
}

export function RowEditor({ open, onClose, cat, first, last, onSave, onMove, onDelete }: Props) {
  const t = useT()
  const [name, setName] = useState('')
  const [required, setRequired] = useState(0)
  const [isMajor, setIsMajor] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(cat?.name ?? '')
    setRequired(cat?.required ?? 0)
    setIsMajor(cat?.isMajor ?? false)
  }, [open, cat])

  const valid = name.trim().length > 0 && required >= 0
  const save = async () => {
    if (!valid) return
    setBusy(true)
    try { await onSave({ name: name.trim(), required, isMajor }); onClose() } finally { setBusy(false) }
  }
  const del = async () => {
    if (!cat || !window.confirm(t('grades.deleteCatConfirm'))) return
    setBusy(true)
    try { await onDelete(); onClose() } finally { setBusy(false) }
  }
  const arrow = 'flex h-10 w-10 items-center justify-center rounded-card border border-line-strong text-ink-muted hover:bg-surface-2 disabled:opacity-30'

  return (
    <Modal open={open} onClose={onClose} title={t(cat ? 'grades.editCreditCat' : 'grades.addCreditCat')}
      footer={<>
        {cat && <Button variant="danger" onClick={del} disabled={busy} className="mr-auto">{t('common.delete')}</Button>}
        <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
        <Button onClick={save} disabled={!valid || busy}>{t('common.save')}</Button>
      </>}>
      <div className="space-y-3">
        <Input label={t('grades.catName')} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input label={t('grades.catRequired')} type="number" inputMode="numeric" min={0} value={required || ''} onChange={(e) => setRequired(e.target.value === '' ? 0 : Number(e.target.value))} hint={t('common.optional')} />
        <label className="flex min-h-11 items-center gap-2.5 text-sm">
          <input type="checkbox" checked={isMajor} onChange={(e) => setIsMajor(e.target.checked)} className="h-4 w-4 accent-[var(--color-ink)]" />
          {t('grades.catMajor')}
        </label>
        {cat && (
          <div className="flex items-center gap-2 pt-1">
            <span className="flex-1 text-sm text-ink-muted">{t('grades.catOrder')}</span>
            <button type="button" className={arrow} disabled={first} aria-label="↑" onClick={() => onMove(-1)}>↑</button>
            <button type="button" className={arrow} disabled={last} aria-label="↓" onClick={() => onMove(1)}>↓</button>
          </div>
        )}
      </div>
    </Modal>
  )
}
