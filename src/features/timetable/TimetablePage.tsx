import { useState } from 'react'
import { Button, Modal, PageHeader, Segmented, Textarea } from '../../components/ui'
import { IconPlus, IconUpload } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { todayISO } from '../../lib/dates'
import { parseTimetable } from '../../lib/parsers/parseTimetable'
import { useSchedule } from './useSchedule'
import { useKinds } from './useKinds'
import { KindManager } from './KindManager'
import { WeekView } from './WeekView'
import { MonthView } from './MonthView'
import { ScheduleForm } from './ScheduleForm'
import type { ScheduleItem } from './schedule'

export function TimetablePage() {
  const t = useT()
  const s = useSchedule()
  const { kinds } = useKinds()
  const [managing, setManaging] = useState(false)
  const [view, setView] = useState<'week' | 'month'>('week')
  const [selected, setSelected] = useState(todayISO())
  const [editing, setEditing] = useState<ScheduleItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [pasting, setPasting] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteResult, setPasteResult] = useState<number | null>(null)

  const closeForm = () => { setEditing(null); setAdding(false) }

  return (
    <>
      <PageHeader title={t('timetable.title')} action={<>
        <Button size="sm" variant="secondary" onClick={() => setPasting(true)}><IconUpload size={16} />{t('timetable.pastePortal')}</Button>
        <Button size="sm" onClick={() => setAdding(true)} className="hidden md:inline-flex"><IconPlus size={16} />{t('timetable.add')}</Button>
        <button type="button" onClick={() => setManaging(true)} aria-label={t('timetable.manageKinds')}
          className="flex h-9 w-9 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2">
          <span aria-hidden="true" className="text-base leading-none">⋯</span>
        </button>
      </>} />

      <div className="mb-4">
        <Segmented label={t('timetable.title')} value={view} onChange={setView}
          options={[{ value: 'week', label: t('timetable.week') }, { value: 'month', label: t('timetable.month') }]} />
      </div>

      {view === 'week'
        ? <WeekView items={s.items} kinds={kinds} onPick={setEditing} />
        : <MonthView items={s.items} kinds={kinds} selected={selected} onSelect={setSelected} onPick={setEditing} />}

      <button type="button" aria-label={t('timetable.add')} onClick={() => setAdding(true)}
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-card bg-primary text-on-primary shadow-soft transition active:scale-95 md:hidden"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 1rem)' }}>
        <IconPlus size={26} />
      </button>

      <ScheduleForm
        open={adding || editing != null}
        onClose={closeForm}
        item={editing}
        kinds={kinds}
        defaultDate={view === 'month' && !editing ? selected : null}
        onSave={async (item) => { if (editing) await s.update(editing.id, item); else await s.add(item) }}
        onDelete={s.remove}
      />

      <KindManager open={managing} onClose={() => setManaging(false)} />

      <Modal open={pasting} onClose={() => { setPasting(false); setPasteResult(null) }} title={t('timetable.pastePortal')}
        footer={<Button onClick={() => setPasteResult(parseTimetable(pasteText).length)} disabled={!pasteText.trim()}>{t('grades.preview')}</Button>}>
        <Textarea rows={8} value={pasteText} onChange={(e) => { setPasteText(e.target.value); setPasteResult(null) }} className="font-mono" />
        {pasteResult === 0 && <p className="mt-3 rounded-card border border-warn/40 px-4 py-3 text-sm font-semibold text-warn">{t('timetable.parserNotReady')}</p>}
      </Modal>
    </>
  )
}
