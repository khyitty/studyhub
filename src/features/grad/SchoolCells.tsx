import { Tag } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { PALETTE_CLASS } from '../../lib/categories'
import { formatShortDate } from '../../lib/dates'
import { STATUS_COLOR, dday, ddayLabel, recsStatus, toeflStatus } from '../../lib/schools'
import type { GreReq, School, SchoolStatus, SopState } from '../../lib/types'

export function DeadlineCell({ school, today }: { school: School; today: string }) {
  const t = useT()
  if (!school.deadline) return <span className="text-ink-faint">—</span>
  const n = dday(school.deadline, today)
  const past = n < 0
  return (
    <span className={`inline-flex items-baseline gap-1.5 tabular-nums ${past ? 'text-ink-faint' : ''}`}>
      <span>{formatShortDate(school.deadline)}</span>
      <span className={`font-bold ${!past && n <= 7 ? 'text-danger' : ''}`}>{past ? t('grad.past') : ddayLabel(n)}</span>
    </span>
  )
}

const GRE_TONE = { required: 'bad', optional: 'warn', none: 'none' } as const
export function GreTag({ gre }: { gre: GreReq }) {
  const t = useT()
  return <Tag tone={GRE_TONE[gre]}>{t(`grad.gre_${gre}`)}</Tag>
}

export function ToeflCell({ school, mine }: { school: School; mine: number | null }) {
  const t = useT()
  if (school.toeflMin == null) return <Tag tone="none">—</Tag>
  const st = toeflStatus(school.toeflMin, mine)
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <span>{school.toeflMin}</span>
      {st === 'ok' && <Tag tone="ok">{t('grad.toeflOk')}</Tag>}
      {st === 'short' && <Tag tone="bad">{t('grad.toeflShort', { score: mine ?? '' })}</Tag>}
      {st === 'unknown' && <Tag tone="none">—</Tag>}
    </span>
  )
}

export function RecsTag({ school }: { school: School }) {
  return <Tag tone={recsStatus(school.recsDone, school.recsRequired)}>{school.recsDone} / {school.recsRequired}</Tag>
}

const SOP_TONE = { none: 'none', todo: 'bad', draft: 'warn', done: 'ok' } as const
export function SopTag({ sop }: { sop: SopState }) {
  const t = useT()
  return <Tag tone={SOP_TONE[sop]}>{t(`grad.sop_${sop}`)}</Tag>
}

export function StatusCell({ status }: { status: SchoolStatus }) {
  const t = useT()
  const color = STATUS_COLOR[status]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-[1px] ${color ? PALETTE_CLASS[color].fill : 'bg-ink-faint'}`} />
      {t(`grad.s_${status}`)}
    </span>
  )
}
