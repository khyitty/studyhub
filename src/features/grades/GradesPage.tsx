import { useState } from 'react'
import { Button, EmptyState, PageHeader } from '../../components/ui'
import { IconGrades, IconUpload } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { useGrades } from './useGrades'
import { ImportModal } from './ImportModal'
import { SummaryCards } from './SummaryCards'
import { GradGauges } from './GradGauges'
import { GpaChart } from './GpaChart'
import { Simulator } from './Simulator'
import { TermAccordion } from './TermAccordion'

export function GradesPage() {
  const t = useT()
  const g = useGrades()
  const [importing, setImporting] = useState(false)
  const empty = !g.loading && g.terms.length === 0 && g.courses.length === 0

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <PageHeader title={t('grades.title')} />
        <Button size="sm" variant="secondary" onClick={() => setImporting(true)} className="mb-4"><IconUpload size={16} />{t('grades.import')}</Button>
      </div>
      {g.loading ? (
        <p className="text-center text-ink-muted">{t('common.loading')}</p>
      ) : empty ? (
        <EmptyState icon={<IconGrades size={32} />} title={t('grades.empty')} action={<Button onClick={() => setImporting(true)}><IconUpload size={18} />{t('grades.import')}</Button>} />
      ) : (
        <div className="space-y-4">
          <SummaryCards g={g} />
          <GradGauges g={g} />
          {g.terms.length > 0 && <GpaChart g={g} />}
          <Simulator g={g} />
          <TermAccordion g={g} />
        </div>
      )}
      <ImportModal open={importing} onClose={() => setImporting(false)} g={g} />
    </>
  )
}
