import type { CSSProperties } from 'react'
import { Tag } from '../../components/ui'
import { IconPlus } from '../../components/icons'
import { useLang, useT } from '../../i18n/useT'
import { cellCourses, gridTermLabel, type CreditCat, type GridRow } from '../../lib/creditCats'
import { earnedCredits, termStats } from '../../lib/gpa'
import type { Course, TermCode } from '../../lib/types'
import type { TermDoc } from './useGrades'

type Props = {
  rows: GridRow[]
  terms: TermDoc[]
  /** courses that count (retake-superseded ones removed) — drives the footer GPA */
  active: Course[]
  firstYear: number | null
  onPickCourse: (c: Course) => void
  onAddCourse: (termCode: TermCode | null, category: string) => void
  onEditRow: (cat: CreditCat) => void
  onAddRow: () => void
}

type Col = { code: TermCode | null; label: string; width: number }

const FIRST_COL = 168
const cell = 'border-b border-l border-line p-1.5'
const sticky = 'sticky left-0 z-10 bg-surface'

function Chip({ c, onClick }: { c: Course; onClick: () => void }) {
  const superseded = c.supersededBy != null
  return (
    <button type="button" onClick={onClick} aria-label={`${c.name} ${c.grade}`}
      className={`flex w-full items-baseline justify-between gap-1.5 rounded-card border border-line px-2 py-1 text-left text-[12px] leading-snug hover:bg-surface-2 ${superseded ? 'text-ink-faint line-through' : ''}`}>
      <span className="min-w-0 flex-1 break-keep">{c.name}</span>
      <b className={`shrink-0 tabular-nums ${superseded ? '' : 'text-s6'}`}>{c.grade}</b>
    </button>
  )
}

/** Semester × credit-category grid. Horizontal scroll with a sticky first column; pure props, no data access. */
export function CreditGrid({ rows, terms, active, firstYear, onPickCourse, onAddCourse, onEditRow, onAddRow }: Props) {
  const t = useT()
  const lang = useLang()
  const sortedTerms = [...terms].sort((a, b) => a.order - b.order)
  const year = firstYear ?? (sortedTerms[0] ? Number(sortedTerms[0].code.slice(0, 4)) : new Date().getFullYear())
  const cols: Col[] = sortedTerms.map((tm) => ({ code: tm.code, label: gridTermLabel(tm.code, year, lang), width: /-[SW]$/.test(tm.code) ? 110 : 146 }))
  // courses with no term — or a term the portal export no longer lists — go to the unassigned column so nothing disappears
  const known = new Set(sortedTerms.map((tm) => tm.code))
  const orphan = (c: Course) => c.termCode == null || !known.has(c.termCode)
  const hasUnassigned = rows.some((r) => r.courses.some(orphan))
  if (hasUnassigned) cols.push({ code: null, label: t('grades.unassigned'), width: 146 })
  const style: CSSProperties = { gridTemplateColumns: `${FIRST_COL}px ${cols.map((c) => `${c.width}px`).join(' ')}` }
  const rowName = (r: GridRow) => r.cat?.name ?? t('grades.otherCat')

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">{t('grades.creditCats')}</h2>
      <div className="overflow-x-auto rounded-card border border-line-strong">
        <div className="grid min-w-max text-[13px]" style={style}>
          {/* header */}
          <div className={`${sticky} border-b border-line p-2`} />
          {cols.map((col) => (
            <div key={col.code ?? '__none__'} className={`${cell} py-2 text-center text-xs font-semibold text-ink-muted`}>{col.label}</div>
          ))}

          {/* rows */}
          {rows.map((row) => {
            const cat = row.cat
            const required = cat?.required ?? 0
            const ratio = required ? Math.min(1, row.earned / required) : 0
            const head = (
              <>
                <span className="block font-bold break-keep">{rowName(row)}</span>
                <span className="mt-0.5 block text-xs text-ink-muted tabular-nums">{required ? `${row.earned} / ${required}` : t('grades.creditSum', { n: row.earned })}</span>
                {cat && <span className="mt-1.5 block h-1 w-full bg-surface-2"><span className="block h-full bg-s5" style={{ width: `${Math.round(ratio * 100)}%` }} /></span>}
                {cat?.isMajor && <Tag tone="none" className="mt-1.5">{t('grades.catMajor')}</Tag>}
              </>
            )
            return [
              cat ? (
                <button key={`${row.id}-head`} type="button" onClick={() => onEditRow(cat)} className={`${sticky} border-b border-line p-2 text-left hover:bg-surface-2`}>{head}</button>
              ) : (
                <div key={`${row.id}-head`} className={`${sticky} border-b border-line p-2`}>{head}</div>
              ),
              ...cols.map((col) => (
                <div key={`${row.id}-${col.code ?? '__none__'}`} className={`${cell} space-y-1`}>
                  {(col.code == null ? row.courses.filter(orphan).sort((a, b) => a.order - b.order) : cellCourses(row, col.code)).map((c) => <Chip key={c.id} c={c} onClick={() => onPickCourse(c)} />)}
                  <button type="button" onClick={() => onAddCourse(col.code, cat?.name ?? '')}
                    aria-label={`${t('grades.addCourse')} · ${rowName(row)} · ${col.label}`}
                    className="flex h-7 w-full items-center justify-center rounded-card border border-dashed border-line-strong text-ink-faint hover:border-ink-faint hover:text-ink-muted">
                    <IconPlus size={14} />
                  </button>
                </div>
              )),
            ]
          })}

          {/* footer: term GPA + credits */}
          <div className={`${sticky} p-2`}>
            <button type="button" onClick={onAddRow} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink">
              <IconPlus size={14} />{t('grades.addCreditCat')}
            </button>
          </div>
          {cols.map((col) => {
            if (col.code == null) return <div key="__none__" className="border-l border-line" />
            const mine = active.filter((c) => c.termCode === col.code)
            const stat = termStats(active, col.code)
            return (
              <div key={col.code} className="border-l border-line p-2 text-center">
                {stat.gpa == null
                  ? <span className="text-[18px] font-extrabold text-ink-faint">{t('grades.na')}</span>
                  : <span className="text-[18px] font-extrabold tabular-nums">{stat.gpa.toFixed(2)}</span>}
                <span className="block text-[11px] text-ink-muted tabular-nums">{t('grades.creditSum', { n: earnedCredits(mine) })}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
