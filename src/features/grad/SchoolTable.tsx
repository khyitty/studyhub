import { Fragment } from 'react'
import { useT } from '../../i18n/useT'
import type { SortKey } from '../../lib/schools'
import type { School } from '../../lib/types'
import { DeadlineCell, GreTag, RecsTag, SopTag, StatusCell, ToeflCell } from './SchoolCells'
import { SchoolDetail } from './SchoolDetail'

type Props = {
  schools: School[]
  today: string
  mine: number | null
  sortKey: SortKey
  onSort: (k: SortKey) => void
  expandedId: string | null
  onToggle: (id: string) => void
  onEdit: (s: School) => void
  onDelete: (id: string) => void
}

const TH = 'px-2.5 py-2 text-left text-[11px] font-semibold text-ink-muted border-b border-line whitespace-nowrap'
const TD = 'px-2.5 py-2.5 border-b border-line/70 whitespace-nowrap align-top'
const COLS = 8

export function SchoolTable({ schools, today, mine, sortKey, onSort, expandedId, onToggle, onEdit, onDelete }: Props) {
  const t = useT()
  const sortable = (k: SortKey, label: string) => (
    <th scope="col" className={TH} aria-sort={sortKey === k ? 'ascending' : 'none'}>
      <button type="button" onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-ink">
        {label}{sortKey === k && <span aria-hidden="true">▾</span>}
      </button>
    </th>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {sortable('name', t('grad.school'))}
            {sortable('deadline', t('grad.deadline'))}
            <th scope="col" className={TH}>{t('grad.gre')}</th>
            <th scope="col" className={TH}>{t('grad.toefl')}</th>
            <th scope="col" className={TH}>{t('grad.recs')}</th>
            <th scope="col" className={TH}>{t('grad.sop')}</th>
            <th scope="col" className={TH}>{t('grad.fee')}</th>
            {sortable('status', t('grad.status'))}
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => {
            const open = expandedId === s.id
            return (
              <Fragment key={s.id}>
                <tr onClick={() => onToggle(s.id)} aria-expanded={open} className="cursor-pointer hover:bg-surface-2/60">
                  <td className={TD}>
                    <span className="block font-bold">{s.name}</span>
                    <span className="block text-[11px] font-normal text-ink-muted">{s.program}</span>
                  </td>
                  <td className={TD}><DeadlineCell school={s} today={today} /></td>
                  <td className={TD}><GreTag gre={s.gre} /></td>
                  <td className={TD}><ToeflCell school={s} mine={mine} /></td>
                  <td className={TD}><RecsTag school={s} /></td>
                  <td className={TD}><SopTag sop={s.sop} /></td>
                  <td className={`${TD} tabular-nums`}>{s.fee || <span className="text-ink-faint">—</span>}</td>
                  <td className={TD}><StatusCell status={s.status} /></td>
                </tr>
                {open && (
                  <tr>
                    <td colSpan={COLS} className="border-b border-line bg-surface-2/40 px-4 py-3">
                      <SchoolDetail school={s} onEdit={() => onEdit(s)} onDelete={() => onDelete(s.id)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
