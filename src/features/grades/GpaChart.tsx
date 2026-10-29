import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../components/ui'
import { useLang, useT } from '../../i18n/useT'
import { gpaOf, GPA_EXCLUDED } from '../../lib/gpa'
import { termLabel } from '../../lib/parsers/termCode'
import type { Grades } from './useGrades'

export function GpaChart({ g }: { g: Grades }) {
  const t = useT()
  const lang = useLang()

  const data = useMemo(() => {
    let credits = 0
    let points = 0
    return g.terms.map((term) => {
      const mine = g.active.filter((c) => c.termCode === term.code)
      const stat = gpaOf(mine)
      for (const c of mine) {
        if (GPA_EXCLUDED.includes(c.grade)) continue
        credits += c.credits
        points += c.point * c.credits
      }
      return {
        label: term.code.slice(2),
        full: termLabel(term.code, lang),
        // portal prints 0 for a term with no graded credits → fall back to the computed value (null)
        term: term.gpa || stat.gpa,
        cum: credits ? Math.round((points / credits) * 100) / 100 : null,
      }
    })
  }, [g.terms, g.active, lang])

  const min = Math.min(3, ...data.flatMap((d) => [d.term ?? 4.5, d.cum ?? 4.5]))
  const floor = Math.floor(min * 2) / 2

  return (
    <Card title={t('grades.trend')}>
      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={false} interval={0} />
            <YAxis domain={[floor, 4.5]} tick={{ fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={false} tickCount={4} />
            <Tooltip labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? ''} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-line)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="term" name={t('grades.termGpa')} stroke="var(--color-peach-deep)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="cum" name={t('grades.cumGpa')} stroke="var(--color-lilac-deep)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
