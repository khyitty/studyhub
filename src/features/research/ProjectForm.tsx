import { useEffect, useState } from 'react'
import { Button, Input, Modal, Segmented, Textarea } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { PROJECT_STATUSES } from '../../lib/projects'
import type { Project, ProjectStatus } from '../../lib/types'
import type { NewProject } from './useProjects'

type Props = { open: boolean; onClose: () => void; project: Project | null; onSave: (p: NewProject) => Promise<void> }

const blank = (): NewProject => ({ name: '', goal: '', status: 'active', note: '', order: 0 })

export function ProjectForm({ open, onClose, project, onSave }: Props) {
  const t = useT()
  const [d, setD] = useState<NewProject>(blank)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setD(project ? { name: project.name, goal: project.goal, status: project.status, note: project.note, order: project.order } : blank())
  }, [open, project])

  const set = <K extends keyof NewProject>(k: K, v: NewProject[K]) => setD((x) => ({ ...x, [k]: v }))
  const valid = d.name.trim().length > 0
  const save = async () => {
    if (!valid) return
    setBusy(true)
    try { await onSave({ ...d, name: d.name.trim(), goal: d.goal.trim(), note: d.note.trim() }); onClose() } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={t(project ? 'research.edit' : 'research.add')}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
        <Button onClick={save} disabled={!valid || busy}>{t('common.save')}</Button>
      </>}>
      <div className="space-y-3">
        <Input label={t('research.name')} value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        <Input label={t('research.goal')} value={d.goal} onChange={(e) => set('goal', e.target.value)} placeholder={t('research.goalPlaceholder')} />
        <div>
          <span className="mb-1 block text-sm font-semibold">{t('research.status')}</span>
          <Segmented label={t('research.status')} value={d.status} onChange={(status: ProjectStatus) => set('status', status)}
            options={PROJECT_STATUSES.map((s) => ({ value: s, label: t(`research.s_${s}`) }))} />
        </div>
        <Textarea label={t('research.note')} rows={4} value={d.note} onChange={(e) => set('note', e.target.value)} />
      </div>
    </Modal>
  )
}
