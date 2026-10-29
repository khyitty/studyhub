import { useState } from 'react'
import { Button, EmptyState, PageHeader } from '../../components/ui'
import { IconGrades, IconUpload } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import { useGrades } from './useGrades'
import { ImportModal } from './ImportModal'
import { KpiRow } from './KpiRow'
import { GradGauges } from './GradGauges'
import { GpaChart } from './GpaChart'
import { Simulator } from './Simulator'
import { TermAccordion } from './TermAccordion'
import { gradesSubtitle } from './gradesSubtitle'

export function GradesPage() {
  const t = useT()
  const g = useGrades()
  const { profile } = useProfile()
  const [importing, setImporting] = useState(false)
  const empty = !g.loading && g.terms.length === 0 && g.courses.length === 0

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
          <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              {g.terms.length > 0 && <GpaChart g={g} />}
              <TermAccordion g={g} />
            </div>
            <div className="divide-y divide-line">
              <GradGauges g={g} />
              <Simulator g={g} />
            </div>
          </div>
        </div>
      )}
      <ImportModal open={importing} onClose={() => setImporting(false)} g={g} />
    </>
  )
}
