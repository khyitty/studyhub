import { Gauge } from '../../components/ui'

export function CompletionStat({ stats, title }: { stats: { done: number; total: number; ratio: number }; title: string }) {
  const pct = Math.round(stats.ratio * 100)
  return (
    <section className="py-4">
      <h2 className="text-sm font-bold">{title}</h2>
      <p className="mt-1 text-[30px] font-extrabold leading-none tracking-[-1px] tabular-nums">
        {pct}<span className="ml-0.5 text-base font-bold text-ink-muted">%</span>
      </p>
      <div className="mt-3"><Gauge value={stats.ratio} size="sm" label={title} hideLabel /></div>
    </section>
  )
}
