import { useEffect, useState } from 'react'
import { Button, Input, Modal, Select } from '../../components/ui'
import { useLang, useT } from '../../i18n/useT'
import { POINT_OF } from '../../lib/gpa'
import { KNOWN_CATEGORIES } from '../../lib/parsers/parseCourseGrades'
import { termLabel } from '../../lib/parsers/termCode'
import { GRADES, type Course, type Grade, type TermCode } from '../../lib/types'
import type { NewCourse, TermDoc } from './useGrades'

type Props = {
  open: boolean
  onClose: () => void
  course: Course | null
  terms: TermDoc[]
  defaultTerm: TermCode | null
  onSave: (c: NewCourse) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

const blank = (termCode: TermCode | null): NewCourse => ({
  code: '', section: '', name: '', category: '전공선택', area: '', credits: 3, score: null, grade: 'A+', point: POINT_OF['A+'], termCode,
})

export function CourseForm({ open, onClose, course, terms, defaultTerm, onSave, onDelete }: Props) {
  const t = useT()
  const lang = useLang()
  const [d, setD] = useState<NewCourse>(() => blank(defaultTerm))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setD(course ? { code: course.code, section: course.section, name: course.name, category: course.category, area: course.area, credits: course.credits, score: course.score, grade: course.grade, point: course.point, termCode: course.termCode } : blank(defaultTerm))
  }, [open, course, defaultTerm])

  const set = <K extends keyof NewCourse>(k: K, v: NewCourse[K]) => setD((x) => ({ ...x, [k]: v }))
  const valid = d.name.trim().length > 0 && d.credits >= 0

  const save = async () => {
    if (!valid) return
    setBusy(true)
    try {
      await onSave({ ...d, name: d.name.trim(), code: d.code.trim(), point: POINT_OF[d.grade] })
      onClose()
    } finally { setBusy(false) }
  }
  const del = async () => {
    if (!course || !onDelete || !window.confirm(t('grades.deleteConfirm'))) return
    setBusy(true)
    try { await onDelete(course.id); onClose() } finally { setBusy(false) }
  }

  const termOptions = [...terms].sort((a, b) => b.order - a.order)
  const categories = KNOWN_CATEGORIES.includes(d.category) || d.category === '' ? KNOWN_CATEGORIES : [d.category, ...KNOWN_CATEGORIES]

  return (
    <Modal open={open} onClose={onClose} title={t(course ? 'grades.editCourse' : 'grades.addCourse')}
      footer={<>
        {course && onDelete && <Button variant="danger" onClick={del} disabled={busy} className="mr-auto">{t('common.delete')}</Button>}
        <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
        <Button onClick={save} disabled={!valid || busy}>{t('common.save')}</Button>
      </>}>
      <div className="space-y-3">
        <Input label={t('grades.course')} value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('grades.term')} value={d.termCode ?? ''} onChange={(e) => set('termCode', e.target.value || null)}>
            <option value="">{t('grades.noTerm')}</option>
            {termOptions.map((tm) => <option key={tm.code} value={tm.code}>{termLabel(tm.code, lang)}</option>)}
          </Select>
          <Select label={t('grades.category')} value={d.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label={t('grades.credits')} type="number" inputMode="numeric" min={0} max={9} value={d.credits} onChange={(e) => set('credits', Number(e.target.value))} />
          <Select label={t('grades.grade')} value={d.grade} onChange={(e) => set('grade', e.target.value as Grade)}>
            {GRADES.map((gr) => <option key={gr} value={gr}>{gr}</option>)}
          </Select>
          <Input label={t('grades.code')} value={d.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="STAT301" hint={t('common.optional')} />
          <Input label={t('grades.score')} type="number" inputMode="decimal" min={0} max={100} value={d.score ?? ''} onChange={(e) => set('score', e.target.value === '' ? null : Number(e.target.value))} hint={t('common.optional')} />
        </div>
      </div>
    </Modal>
  )
}
