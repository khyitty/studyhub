import { useState } from 'react'
import { Button, Card, Select, Tag } from '../../components/ui'
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
        className={`grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-3.5 py-1.5 text-left text-[13px] hover:bg-surface-2 ${superseded ? 'text-ink-faint' : ''}`}>
        <span className="min-w-0 break-keep leading-snug">
          {c.name}
          {superseded && <span className="ml-1.5 text-[11px] text-danger">{t('grades.retake')}</span>}
          {c.source === 'manual' && <Tag tone="none" className="ml-1.5">{t('grades.manual')}</Tag>}
        </span>
        <span className="text-xs text-ink-muted">{c.category}</span>
        <span className="text-xs text-ink-muted tabular-nums">{t('grades.creditSum', { n: c.credits })}</span>
        <span className="w-7 text-right font-bold tabular-nums">{c.grade}</span>
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
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('grades.terms')}</h2>
        <Button size="sm" variant="ghost" onClick={() => setAdding(g.terms.at(-1)?.code ?? null)}><IconPlus size={16} />{t('grades.addCourse')}</Button>
      </div>
      <div className="border-b border-line">
        {[...g.terms].reverse().map((term) => {
          const mine = g.courses.filter((c) => c.termCode === term.code).sort((a, b) => a.order - b.order)
          const stat = termStats(g.active, term.code)
          const gpa = term.gpa || stat.gpa
          const earned = term.earned ?? earnedCredits(mine.filter((c) => c.supersededBy == null))
          return (
            <details key={term.code} className="group border-t border-line">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 py-1 text-[13px] [&::-webkit-details-marker]:hidden">
                <span className="flex-1 font-bold">{termLabel(term.code, lang)}</span>
                <span className="text-xs text-ink-muted">{t('grades.courseCount', { n: mine.length })} · {t('grades.creditSum', { n: earned })}</span>
                <span className="w-12 text-right font-bold tabular-nums">{gpa == null ? '–' : gpa.toFixed(2)}</span>
                <span className="text-ink-faint transition group-open:rotate-90">›</span>
              </summary>
              <ul className="mb-2 bg-surface-2/60">
                {mine.length === 0 && <li className="py-3 text-center text-[13px] text-ink-muted">{t('common.empty')}</li>}
                {mine.map((c) => <CourseRow key={c.id} c={c} onClick={() => setEditing(c)} />)}
              </ul>
            </details>
          )
        })}
      </div>

      {unassigned.length > 0 && (
        <Card bordered title={t('grades.unassigned')} className="mt-4">
          <ul className="divide-y divide-line">
            {unassigned.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2 text-[13px]">
                <span className="min-w-0 flex-1 break-keep">{c.name} <span className="text-xs text-ink-muted">{c.grade} · {t('grades.creditSum', { n: c.credits })}</span></span>
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
    </section>
  )
}
