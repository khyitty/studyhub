import { useEffect, useState } from 'react'
import { Button, Input, Modal } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import { todayISO } from '../../lib/dates'
import { KINDS, KIND_STYLE, validateScheduleItem, type ScheduleItem, type ScheduleKind } from './schedule'
import type { NewScheduleItem } from './useSchedule'

type Props = {
  open: boolean
  onClose: () => void
  item: ScheduleItem | null
  defaultDate: string | null
  onSave: (item: NewScheduleItem) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

function Chip({ active, onClick, children, className = '' }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={`min-h-10 min-w-10 rounded-pill border px-3 text-sm font-semibold transition ${active ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-ink-muted hover:text-ink'} ${className}`}>
      {children}
    </button>
  )
}

export function ScheduleForm({ open, onClose, item, defaultDate, onSave, onDelete }: Props) {
  const t = useT()
  const { profile } = useProfile()
  const dayNames = t('timetable.dayNames').split(',') // Sun..Sat
  const blank = (): NewScheduleItem => ({
    title: '', kind: 'class', days: [], start: '09:00', end: '10:15', place: '',
    repeat: defaultDate ? 'once' : 'weekly', date: defaultDate ?? todayISO(), from: profile.termStart, to: profile.termEnd,
  })
  const [d, setD] = useState<NewScheduleItem>(blank)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors([])
    if (item) { const { id: _id, ...rest } = item; setD(rest) } else setD(blank())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, defaultDate])

  const set = <K extends keyof NewScheduleItem>(k: K, v: NewScheduleItem[K]) => setD((x) => ({ ...x, [k]: v }))
  const toggleDay = (day: number) => set('days', d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day].sort())

  const save = async () => {
    const errs = validateScheduleItem(d)
    setErrors(errs)
    if (errs.length) return
    setBusy(true)
    try {
      await onSave({ ...d, title: d.title.trim(), place: d.place.trim(), days: d.repeat === 'weekly' ? d.days : [], date: d.repeat === 'once' ? d.date : null })
      onClose()
    } finally { setBusy(false) }
  }
  const del = async () => {
    if (!item || !onDelete || !window.confirm(t('timetable.deleteConfirm'))) return
    setBusy(true)
    try { await onDelete(item.id); onClose() } finally { setBusy(false) }
  }

  // weekday order Mon..Sun → index into dayNames (Sun=0)
  const weekdays = [1, 2, 3, 4, 5, 6, 7]

  return (
    <Modal open={open} onClose={onClose} title={t(item ? 'timetable.edit' : 'timetable.add')}
      footer={<>
        {item && onDelete && <Button variant="danger" onClick={del} disabled={busy} className="mr-auto">{t('common.delete')}</Button>}
        <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
        <Button onClick={save} disabled={busy}>{t('common.save')}</Button>
      </>}>
      <div className="space-y-4">
        <Input label={t('timetable.name')} value={d.title} onChange={(e) => set('title', e.target.value)} autoFocus />

        <div>
          <span className="mb-1 block text-sm font-semibold">{t('timetable.kind')}</span>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k: ScheduleKind) => (
              <button key={k} type="button" aria-pressed={d.kind === k} onClick={() => set('kind', k)}
                className={`min-h-10 rounded-pill px-3 text-sm font-semibold text-ink transition ${KIND_STYLE[k].bg} ${d.kind === k ? 'ring-2 ring-ink ring-offset-1 ring-offset-surface' : 'opacity-70 hover:opacity-100'}`}>
                {t(`timetable.${k}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold">{t('timetable.repeat')}</span>
          <div className="flex gap-2">
            <Chip active={d.repeat === 'weekly'} onClick={() => set('repeat', 'weekly')} className="flex-1">{t('timetable.weekly')}</Chip>
            <Chip active={d.repeat === 'once'} onClick={() => set('repeat', 'once')} className="flex-1">{t('timetable.once')}</Chip>
          </div>
        </div>

        {d.repeat === 'weekly' ? (
          <>
            <div>
              <span className="mb-1 block text-sm font-semibold">{t('timetable.days')}</span>
              <div className="flex gap-1.5">
                {weekdays.map((wd) => (
                  <Chip key={wd} active={d.days.includes(wd)} onClick={() => toggleDay(wd)} className="flex-1 px-0">{dayNames[wd % 7]}</Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label={`${t('timetable.period')} · ${t('timetable.from')}`} type="date" value={d.from} onChange={(e) => set('from', e.target.value)} />
              <Input label={t('timetable.to')} type="date" value={d.to} onChange={(e) => set('to', e.target.value)} />
            </div>
          </>
        ) : (
          <Input label={t('timetable.date')} type="date" value={d.date ?? ''} onChange={(e) => set('date', e.target.value || null)} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('timetable.start')} type="time" value={d.start} onChange={(e) => set('start', e.target.value)} step={300} />
          <Input label={t('timetable.end')} type="time" value={d.end} onChange={(e) => set('end', e.target.value)} step={300} />
        </div>
        <Input label={t('timetable.place')} value={d.place} onChange={(e) => set('place', e.target.value)} hint={t('common.optional')} />

        {errors.length > 0 && (
          <ul className="rounded-card border border-danger/40 px-4 py-3 text-sm font-semibold text-danger">
            {errors.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        )}
      </div>
    </Modal>
  )
}
