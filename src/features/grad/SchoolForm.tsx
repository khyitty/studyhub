import { useEffect, useState } from 'react'
import { Button, Input, Modal, Select, Textarea } from '../../components/ui'
import { IconTrash } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { SCHOOL_STATUSES, validateSchool } from '../../lib/schools'
import type { GreReq, School, SopState } from '../../lib/types'
import type { NewSchool } from './useSchools'

type Props = {
  open: boolean
  onClose: () => void
  school: School | null
  onSave: (data: NewSchool) => Promise<void>
}

const GRE: GreReq[] = ['required', 'optional', 'none']
const SOP: SopState[] = ['todo', 'draft', 'done', 'none']

const blank = (): NewSchool => ({
  name: '', program: '', deadline: '', gre: 'none', toeflMin: null, recsRequired: 3, recsDone: 0,
  sop: 'todo', fee: '', status: 'interested', notes: '', links: [], professors: [],
})

const numOrNull = (v: string) => (v === '' ? null : Number(v))

export function SchoolForm({ open, onClose, school, onSave }: Props) {
  const t = useT()
  const [d, setD] = useState<NewSchool>(blank)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors([])
    if (school) { const { id: _id, createdAt: _c, ...rest } = school; setD(rest) } else setD(blank())
  }, [open, school])

  const set = <K extends keyof NewSchool>(k: K, v: NewSchool[K]) => setD((x) => ({ ...x, [k]: v }))
  const setLink = (i: number, patch: Partial<{ title: string; url: string }>) => set('links', d.links.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const setProf = (i: number, patch: Partial<{ name: string; note: string }>) => set('professors', d.professors.map((p, j) => (j === i ? { ...p, ...patch } : p)))

  const save = async () => {
    const errs = validateSchool(d)
    setErrors(errs)
    if (errs.length) return
    setBusy(true)
    try {
      await onSave({
        ...d, name: d.name.trim(), program: d.program.trim(), fee: d.fee.trim(), notes: d.notes.trim(),
        links: d.links.filter((l) => l.url.trim() || l.title.trim()),
        professors: d.professors.filter((p) => p.name.trim() || p.note.trim()),
      })
      onClose()
    } finally { setBusy(false) }
  }

  const rowBtn = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2'

  return (
    <Modal open={open} onClose={onClose} title={t(school ? 'grad.edit' : 'grad.add')}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
        <Button onClick={save} disabled={busy}>{t('common.save')}</Button>
      </>}>
      <div className="space-y-4">
        <Input label={t('grad.name')} value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        <Input label={t('grad.program')} value={d.program} onChange={(e) => set('program', e.target.value)} hint={t('grad.programHint')} />
        <Input label={t('grad.deadline')} type="date" value={d.deadline} onChange={(e) => set('deadline', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('grad.gre')} value={d.gre} onChange={(e) => set('gre', e.target.value as GreReq)}>
            {GRE.map((g) => <option key={g} value={g}>{t(`grad.gre_${g}`)}</option>)}
          </Select>
          <Input label={t('grad.toeflMin')} type="number" inputMode="numeric" min={0} max={120} value={d.toeflMin ?? ''} onChange={(e) => set('toeflMin', numOrNull(e.target.value))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('grad.recsRequired')} type="number" inputMode="numeric" min={0} max={10} value={d.recsRequired} onChange={(e) => set('recsRequired', Number(e.target.value))} />
          <Input label={t('grad.recsDone')} type="number" inputMode="numeric" min={0} max={10} value={d.recsDone} onChange={(e) => set('recsDone', Number(e.target.value))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('grad.sop')} value={d.sop} onChange={(e) => set('sop', e.target.value as SopState)}>
            {SOP.map((s) => <option key={s} value={s}>{t(`grad.sop_${s}`)}</option>)}
          </Select>
          <Input label={t('grad.fee')} value={d.fee} onChange={(e) => set('fee', e.target.value)} placeholder="$125" />
        </div>
        <Select label={t('grad.status')} value={d.status} onChange={(e) => set('status', e.target.value as School['status'])}>
          {SCHOOL_STATUSES.map((s) => <option key={s} value={s}>{t(`grad.s_${s}`)}</option>)}
        </Select>
        <Textarea label={t('grad.notes')} rows={3} value={d.notes} onChange={(e) => set('notes', e.target.value)} />

        <div>
          <span className="mb-1 block text-sm font-semibold">{t('grad.links')}</span>
          <ul className="space-y-2">
            {d.links.map((l, i) => (
              <li key={i} className="flex items-end gap-2">
                <Input aria-label={t('grad.linkTitle')} placeholder={t('grad.linkTitle')} value={l.title} onChange={(e) => setLink(i, { title: e.target.value })} className="w-32" />
                <Input aria-label={t('grad.linkUrl')} placeholder="https://" type="url" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} />
                <button type="button" aria-label={t('common.delete')} onClick={() => set('links', d.links.filter((_, j) => j !== i))} className={rowBtn}><IconTrash size={16} /></button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-1" onClick={() => set('links', [...d.links, { title: '', url: '' }])}>+ {t('grad.addLink')}</Button>
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold">{t('grad.professors')}</span>
          <ul className="space-y-2">
            {d.professors.map((p, i) => (
              <li key={i} className="flex items-end gap-2">
                <Input aria-label={t('grad.profName')} placeholder={t('grad.profName')} value={p.name} onChange={(e) => setProf(i, { name: e.target.value })} className="w-32" />
                <Input aria-label={t('grad.profNote')} placeholder={t('grad.profNote')} value={p.note} onChange={(e) => setProf(i, { note: e.target.value })} />
                <button type="button" aria-label={t('common.delete')} onClick={() => set('professors', d.professors.filter((_, j) => j !== i))} className={rowBtn}><IconTrash size={16} /></button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-1" onClick={() => set('professors', [...d.professors, { name: '', note: '' }])}>+ {t('grad.addProf')}</Button>
        </div>

        {errors.length > 0 && (
          <ul className="rounded-card border border-danger/40 px-4 py-3 text-sm font-semibold text-danger">
            {errors.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        )}
      </div>
    </Modal>
  )
}
