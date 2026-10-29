import { useState } from 'react'
import { Button, Modal, PageHeader, Textarea } from '../../components/ui'
import { IconPlus, IconUpload } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { todayISO } from '../../lib/dates'
import { parseTimetable } from '../../lib/parsers/parseTimetable'
import { useSchedule } from './useSchedule'
import { WeekView } from './WeekView'
import { MonthView } from './MonthView'
import { ScheduleForm } from './ScheduleForm'
import type { ScheduleItem } from './schedule'

export function TimetablePage() {
  const t = useT()
  const s = useSchedule()
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
      <div className="mb-4 flex items-center justify-between gap-2">
        <PageHeader title={t('timetable.title')} />
        <Button size="sm" variant="secondary" onClick={() => setPasting(true)} className="mb-4"><IconUpload size={16} />{t('timetable.pastePortal')}</Button>
      </div>

      <div role="radiogroup" aria-label={t('timetable.title')} className="mb-4 flex rounded-pill bg-surface-2 p-1">
        {(['week', 'month'] as const).map((v) => (
          <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)}
            className={`min-h-10 flex-1 rounded-pill text-sm font-semibold transition ${view === v ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted'}`}>
            {t(`timetable.${v}`)}
          </button>
        ))}
      </div>

      {view === 'week'
        ? <WeekView items={s.items} onPick={setEditing} />
        : <MonthView items={s.items} selected={selected} onSelect={setSelected} onPick={setEditing} />}

      <button type="button" aria-label={t('timetable.add')} onClick={() => setAdding(true)}
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-soft transition active:scale-95 md:bottom-6"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 1rem)' }}>
        <IconPlus size={26} />
      </button>

      <ScheduleForm
        open={adding || editing != null}
        onClose={closeForm}
        item={editing}
        defaultDate={view === 'month' && !editing ? selected : null}
        onSave={async (item) => { if (editing) await s.update(editing.id, item); else await s.add(item) }}
        onDelete={s.remove}
      />

      <Modal open={pasting} onClose={() => { setPasting(false); setPasteResult(null) }} title={t('timetable.pastePortal')}
        footer={<Button onClick={() => setPasteResult(parseTimetable(pasteText).length)} disabled={!pasteText.trim()}>{t('grades.preview')}</Button>}>
        <Textarea rows={8} value={pasteText} onChange={(e) => { setPasteText(e.target.value); setPasteResult(null) }} className="font-mono" />
        {pasteResult === 0 && <p className="mt-3 rounded-card bg-butter px-4 py-3 text-sm font-semibold text-butter-deep">{t('timetable.parserNotReady')}</p>}
      </Modal>
    </>
  )
}
