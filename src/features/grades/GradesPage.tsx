import { useState } from 'react'
import { Button, EmptyState, PageHeader } from '../../components/ui'
import { IconGrades, IconUpload } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import type { CreditCat } from '../../lib/creditCats'
import type { Course, TermCode } from '../../lib/types'
import { useGrades } from './useGrades'
import { ImportModal } from './ImportModal'
import { KpiRow } from './KpiRow'
import { GpaChart } from './GpaChart'
import { Simulator } from './Simulator'
import { CreditGrid } from './CreditGrid'
import { CourseForm } from './CourseForm'
import { RowEditor, type RowPatch } from './RowEditor'
import { gradesSubtitle } from './gradesSubtitle'

type Adding = { termCode: TermCode | null; category: string }

export function GradesPage() {
  const t = useT()
  const g = useGrades()
  const { profile } = useProfile()
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [adding, setAdding] = useState<Adding | null>(null)
  const [rowEdit, setRowEdit] = useState<CreditCat | null | 'new'>(null)
  const empty = !g.loading && g.terms.length === 0 && g.courses.length === 0
  const catNames = g.cats.map((c) => c.name)
  const rowCat = rowEdit === 'new' ? null : rowEdit
  const rowIndex = rowCat ? g.cats.findIndex((c) => c.id === rowCat.id) : -1

  const saveRow = async (p: RowPatch) => {
    if (!rowCat) {
      await g.addCat({ name: p.name, aliases: [], required: p.required, isMajor: p.isMajor, order: g.cats.length ? Math.max(...g.cats.map((c) => c.order)) + 1 : 0 })
      return
    }
    if (p.name !== rowCat.name) await g.renameCat(rowCat, p.name, g.courses)
    if (p.required !== rowCat.required || p.isMajor !== rowCat.isMajor) await g.updateCat(rowCat.id, { required: p.required, isMajor: p.isMajor })
  }

  return (
    <>
      <PageHeader title={t('grades.title')} subtitle={gradesSubtitle(g.terms, g.cumulative.gpa, profile.gpaPortal, t) || undefined}
        action={<Button size="sm" variant="secondary" onClick={() => setImporting(true)}><IconUpload size={16} />{t('grades.import')}</Button>} />
      {g.loading ? (
        <p className="text-center text-ink-muted">{t('common.loading')}</p>
      ) : empty ? (
        <EmptyState icon={<IconGrades size={32} />} title={t('grades.empty')} action={<Button onClick={() => setImporting(true)}><IconUpload size={18} />{t('grades.import')}</Button>} />
      ) : (
        <div className="space-y-6">
          <KpiRow g={g} />
          {g.terms.length > 0 && <GpaChart g={g} />}
          <CreditGrid rows={g.rows} terms={g.terms} active={g.active} firstYear={g.firstYear}
            onPickCourse={setEditing}
            onAddCourse={(termCode, category) => setAdding({ termCode, category })}
            onEditRow={setRowEdit}
            onAddRow={() => setRowEdit('new')} />
          <div className="border-t border-line"><Simulator g={g} /></div>
        </div>
      )}

      <CourseForm
        open={editing != null || adding != null}
        onClose={() => { setEditing(null); setAdding(null) }}
        course={editing}
        terms={g.terms}
        categories={catNames}
        defaultTerm={adding?.termCode ?? null}
        defaultCategory={adding?.category ?? null}
        onSave={async (c) => { if (editing) await g.updateCourse(editing.id, c); else await g.addCourse(c) }}
        onDelete={g.removeCourse}
      />
      <RowEditor
        open={rowEdit !== null}
        onClose={() => setRowEdit(null)}
        cat={rowCat}
        first={rowIndex <= 0}
        last={rowIndex < 0 || rowIndex >= g.cats.length - 1}
        onSave={saveRow}
        onMove={(dir) => { if (rowCat) void g.moveCat(rowCat.id, dir) }}
        onDelete={async () => { if (rowCat) await g.removeCat(rowCat.id) }}
      />
      <ImportModal open={importing} onClose={() => setImporting(false)} g={g} />
    </>
  )
}
