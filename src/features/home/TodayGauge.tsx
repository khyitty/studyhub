import { Gauge } from '../../components/ui'
import { useT } from '../../i18n/useT'
import type { Todo } from '../../lib/types'

export function TodayGauge({ today, ratio }: { today: Todo[]; ratio: number }) {
  const t = useT()
  const done = today.filter((x) => x.done).length
  const complete = today.length > 0 && ratio >= 1
  return (
    <div className={`flex items-center gap-5 rounded-card p-4 shadow-soft transition-colors ${complete ? 'bg-mint' : 'bg-surface'}`}>
      <Gauge value={today.length ? ratio : 0} size="lg" label={t('home.progress')} color={complete ? 'var(--color-mint-deep)' : 'var(--color-peach-deep)'} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-muted">{t('home.progress')}</p>
        {today.length === 0 ? (
          <p className="mt-1 text-base font-bold">{t('home.noTodos')}</p>
        ) : (
          <>
            <p className="mt-1 text-2xl font-bold tabular-nums">{done} / {today.length}</p>
            {complete && <p className="mt-1 text-sm font-semibold text-mint-deep">{t('home.allDone')}</p>}
          </>
        )}
      </div>
    </div>
  )
}
