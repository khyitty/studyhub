import { useState } from 'react'
import { Button, Card, Select } from '../../components/ui'
import { IconPlus } from '../../components/icons'
import { useLang, useT } from '../../i18n/useT'
import { earnedCredits, termStats } from '../../lib/gpa'
import { termLabel } from '../../lib/parsers/termCode'
import type { Course, TermCode } from '../../lib/types'
import { CourseForm } from './CourseForm'
import type { Grades } from './useGrades'

function CourseRow({ c, onClick }: { c: Course; onClick: () => void }) {
  const t = useT()
  const superseded = c.supersededBy != null
  return (
    <li>
      <button type="button" onClick={onClick}
        className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-1 py-2 text-left hover:bg-surface-2 ${superseded ? 'opacity-50' : ''}`}>
        <span className="min-w-0 break-keep font-semibold leading-snug">{c.name}</span>
        <span className="text-right font-bold tabular-nums">{c.grade}</span>
        <span className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
          {c.category && <span className="rounded-pill bg-surface-2 px-2 py-0.5">{c.category}</span>}
          <span>{t('grades.creditSum', { n: c.credits })}</span>
          {c.source === 'manual' && <span className="rounded-pill bg-lilac px-2 py-0.5 text-lilac-deep">{t('grades.manual')}</span>}
          {superseded && <span className="rounded-pill bg-butter px-2 py-0.5 text-butter-deep">{t('grades.retake')}</span>}
        </span>
        <span className="text-right text-xs tabular-nums text-ink-muted">{c.point.toFixed(1)}</span>
      </button>
    </li>
  )
}

export function TermAccordion({ g }: { g: Grades }) {
  const t = useT()
  const lang = useLang()
  const [editing, setEditing] = useState<Course | null>(null)
  const [adding, setAdding] = useState<TermCode | null | false>(false)
  const unassigned = g.courses.filter((c) => c.termCode == null)
  const open = editing != null || adding !== false

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-bold">{t('grades.terms')}</h2>
        <Button size="sm" variant="secondary" onClick={() => setAdding(g.terms.at(-1)?.code ?? null)}><IconPlus size={16} />{t('grades.addCourse')}</Button>
      </div>
      <div className="space-y-2">
        {[...g.terms].reverse().map((term) => {
          const mine = g.courses.filter((c) => c.termCode === term.code).sort((a, b) => a.order - b.order)
          const stat = termStats(g.active, term.code)
          const gpa = term.gpa || stat.gpa
          const earned = term.earned ?? earnedCredits(mine.filter((c) => c.supersededBy == null))
          return (
            <details key={term.code} className="group rounded-card bg-surface shadow-soft">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden">
                <span className="flex-1 font-semibold">{termLabel(term.code, lang)}</span>
                <span className="text-sm text-ink-muted">{t('grades.creditSum', { n: earned })}</span>
                <span className="w-12 text-right font-bold tabular-nums">{gpa == null ? '–' : gpa.toFixed(2)}</span>
                <span className="text-ink-muted transition group-open:rotate-90">›</span>
              </summary>
              <ul className="divide-y divide-line border-t border-line px-3 pb-2">
                {mine.length === 0 && <li className="py-3 text-center text-sm text-ink-muted">{t('common.empty')}</li>}
                {mine.map((c) => <CourseRow key={c.id} c={c} onClick={() => setEditing(c)} />)}
              </ul>
            </details>
          )
        })}
      </div>

      {unassigned.length > 0 && (
        <Card title={t('grades.unassigned')} tone="butter" className="mt-4">
          <ul className="divide-y divide-line">
            {unassigned.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 break-keep font-semibold">{c.name} <span className="text-xs text-ink-muted">{c.grade} · {t('grades.creditSum', { n: c.credits })}</span></span>
                <Select aria-label={t('grades.assignTerm')} value="" onChange={(e) => e.target.value && void g.updateCourse(c.id, { termCode: e.target.value })} className="w-32">
                  <option value="">{t('grades.assignTerm')}</option>
                  {g.terms.map((tm) => <option key={tm.code} value={tm.code}>{termLabel(tm.code, lang)}</option>)}
                </Select>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CourseForm
        open={open}
        onClose={() => { setEditing(null); setAdding(false) }}
        course={editing}
        terms={g.terms}
        defaultTerm={adding === false ? null : adding}
        onSave={async (c) => { if (editing) await g.updateCourse(editing.id, c); else await g.addCourse(c) }}
        onDelete={g.removeCourse}
      />
    </>
  )
}
