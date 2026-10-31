import { Button, Segmented } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { formatShortDate } from '../../lib/dates'
import { PAPER_STATUSES } from '../../lib/papers'
import type { Paper, PaperStatus } from '../../lib/types'
import { authorsLine } from './PaperList'

type Props = { paper: Paper; onEdit: () => void; onDelete: () => void; onStatus: (s: PaperStatus) => void }

export function PaperDetail({ paper, onEdit, onDelete, onStatus }: Props) {
  const t = useT()
  const link = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : paper.arxivId ? `https://arxiv.org/abs/${paper.arxivId}` : '')
  const del = () => { if (window.confirm(t('papers.deleteConfirm'))) onDelete() }
  return (
    <div className="space-y-4 text-[13px]">
      <p className="text-ink-muted">{[authorsLine(paper), paper.venue].filter(Boolean).join(' · ')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label={t('papers.status')} value={paper.status} onChange={onStatus} options={PAPER_STATUSES.map((s) => ({ value: s, label: t(`papers.s_${s}`) }))} />
        {paper.readAt && <span className="text-xs text-ink-muted">{t('papers.readAt')} {formatShortDate(paper.readAt.slice(0, 10))}</span>}
      </div>
      {paper.tags.length > 0 && <p className="text-xs text-ink-muted">{paper.tags.map((x) => `#${x}`).join('  ')}</p>}
      {paper.summary && <p className="font-semibold leading-snug break-keep">{paper.summary}</p>}
      {paper.quotes.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-ink-muted">{t('papers.quotes')}</p>
          <ul className="mt-1 space-y-1.5">
            {paper.quotes.map((q, i) => <li key={i} className="border-l-2 border-s4 pl-2.5 leading-snug">{q}</li>)}
          </ul>
        </div>
      )}
      {paper.notes && (
        <div>
          <p className="text-[11px] font-bold text-ink-muted">{t('papers.notes')}</p>
          <p className="mt-1 whitespace-pre-wrap leading-relaxed">{paper.notes}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center rounded-card border border-line-strong px-3 text-sm font-semibold hover:bg-surface-2">{t('papers.open')}</a>}
        <Button size="sm" variant="secondary" onClick={onEdit}>{t('common.edit')}</Button>
        <Button size="sm" variant="ghost" onClick={del} className="text-danger">{t('common.delete')}</Button>
      </div>
    </div>
  )
}
