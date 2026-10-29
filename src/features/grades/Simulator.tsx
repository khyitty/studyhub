import { useEffect, useState } from 'react'
import { Button, Input, Select } from '../../components/ui'
import { IconPlus, IconTrash } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import { projectedGpa, requiredAverage } from '../../lib/gpa'
import { GRADES, type Grade } from '../../lib/types'
import type { Grades } from './useGrades'

type Planned = { credits: number; grade: Grade }

export function Simulator({ g }: { g: Grades }) {
  const t = useT()
  const { profile } = useProfile()
  const autoRemaining = Math.max(0, profile.gradReq.total - g.progress.total.earned)
  const [target, setTarget] = useState(4.3)
  const [remaining, setRemaining] = useState(autoRemaining)
  const [planned, setPlanned] = useState<Planned[]>([])
  useEffect(() => setRemaining(autoRemaining), [autoRemaining])

  const need = requiredAverage(g.cumulative.points, g.cumulative.credits, target, remaining)
  const impossible = need != null && need > 4.5
  const projected = planned.length ? projectedGpa(g.cumulative.points, g.cumulative.credits, planned) : null

  return (
    <details className="rounded-card bg-surface p-4 shadow-soft">
      <summary className="min-h-11 cursor-pointer list-none font-bold [&::-webkit-details-marker]:hidden">{t('grades.simulator')}</summary>
      <div className="mt-3 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('grades.target')} type="number" inputMode="decimal" step="0.01" min={0} max={4.5} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          <Input label={t('grades.remaining')} type="number" inputMode="numeric" min={0} value={remaining} onChange={(e) => setRemaining(Number(e.target.value))} />
        </div>
        <p className={`rounded-card px-4 py-3 text-sm font-semibold ${impossible ? 'bg-danger/10 text-danger' : 'bg-mint text-mint-deep'}`}>
          {need == null ? t('grades.currentCum', { gpa: g.cumulative.gpa?.toFixed(2) ?? '–' }) : impossible ? t('grades.impossible') : t('grades.needAvg', { avg: Math.max(0, need).toFixed(2) })}
        </p>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">{t('grades.planned')}</span>
            <Button size="sm" variant="ghost" onClick={() => setPlanned((p) => [...p, { credits: 3, grade: 'A+' }])}><IconPlus size={16} />{t('grades.addPlanned')}</Button>
          </div>
          <ul className="space-y-2">
            {planned.map((p, i) => (
              <li key={i} className="flex items-end gap-2">
                <Input label={t('grades.credits')} type="number" inputMode="numeric" min={0} max={9} value={p.credits}
                  onChange={(e) => setPlanned((l) => l.map((x, j) => (j === i ? { ...x, credits: Number(e.target.value) } : x)))} />
                <Select label={t('grades.grade')} value={p.grade} onChange={(e) => setPlanned((l) => l.map((x, j) => (j === i ? { ...x, grade: e.target.value as Grade } : x)))}>
                  {GRADES.map((gr) => <option key={gr} value={gr}>{gr}</option>)}
                </Select>
                <button type="button" aria-label={t('common.delete')} onClick={() => setPlanned((l) => l.filter((_, j) => j !== i))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-muted hover:bg-surface-2"><IconTrash size={18} /></button>
              </li>
            ))}
          </ul>
          {projected != null && <p className="mt-2 text-sm font-semibold text-lilac-deep">{t('grades.projected', { gpa: projected.toFixed(2) })}</p>}
        </div>
      </div>
    </details>
  )
}
