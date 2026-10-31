import { Tag, type TagTone } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { formatShortDate } from '../../lib/dates'
import { useIsDesktop } from '../../lib/useIsDesktop'
import type { Paper, PaperStatus } from '../../lib/types'

export const STATUS_TONE: Record<PaperStatus, TagTone> = { toread: 'none', reading: 'warn', read: 'ok' }

export function StatusTag({ status }: { status: PaperStatus }) {
  const t = useT()
  return <Tag tone={STATUS_TONE[status]}>{t(`papers.s_${status}`)}</Tag>
}

export function authorsLine(p: Paper): string {
  const a = p.authors.length > 2 ? `${p.authors[0]} et al.` : p.authors.join(', ')
  return [a, p.year].filter(Boolean).join(' · ')
}

const TH = 'px-3 py-2 text-left text-xs font-semibold text-ink-muted'
const TD = 'px-3 py-2.5 align-top'

type Props = { papers: Paper[]; onOpen: (p: Paper) => void }

/** Desktop table / mobile cards; a row click opens the detail modal. */
export function PaperList({ papers, onOpen }: Props) {
  const t = useT()
  const desktop = useIsDesktop()

  if (!desktop) {
    return (
      <ul className="divide-y divide-line">
        {papers.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onOpen(p)} className="w-full py-3 text-left hover:bg-surface-2/60">
              <span className="block text-sm font-semibold leading-snug break-keep">{p.title}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">{[authorsLine(p), p.venue].filter(Boolean).join(' · ')}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1">
                <StatusTag status={p.status} />
                {p.tags.map((tag) => <Tag key={tag} tone="none">#{tag}</Tag>)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="overflow-x-auto rounded-card border border-line-strong">
      <table className="w-full text-[13px]">
        <thead className="border-b border-line bg-surface-2/60">
          <tr>
            <th className={TH}>{t('papers.paperTitle')}</th>
            <th className={TH}>{t('papers.authors')}</th>
            <th className={TH}>{t('papers.venue')}</th>
            <th className={TH}>{t('papers.tags')}</th>
            <th className={TH}>{t('papers.status')}</th>
            <th className={`${TH} text-right`}>{t('papers.addedAt')}</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-b-0 hover:bg-surface-2/60">
              <td className={TD}>
                <button type="button" onClick={() => onOpen(p)} className="text-left font-semibold leading-snug break-keep hover:underline">{p.title}</button>
              </td>
              <td className={`${TD} text-ink-muted`}>{authorsLine(p) || <span className="text-ink-faint">—</span>}</td>
              <td className={`${TD} text-ink-muted`}>{p.venue || <span className="text-ink-faint">—</span>}</td>
              <td className={TD}><span className="flex flex-wrap gap-1">{p.tags.map((tag) => <Tag key={tag} tone="none">#{tag}</Tag>)}</span></td>
              <td className={TD}><StatusTag status={p.status} /></td>
              <td className={`${TD} text-right text-ink-muted tabular-nums`}>{formatShortDate(p.addedAt.slice(0, 10))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
