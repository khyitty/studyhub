import { useEffect, useState } from 'react'
import { Button, Input, Modal, Segmented, Textarea } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { PAPER_STATUSES, fetchPaperMeta, parsePaperRef } from '../../lib/papers'
import type { Paper, PaperStatus } from '../../lib/types'
import type { NewPaper } from './usePapers'

type Props = {
  open: boolean
  onClose: () => void
  paper: Paper | null
  onSave: (p: NewPaper) => Promise<void>
}

type Draft = Omit<NewPaper, 'authors' | 'tags' | 'quotes' | 'year'> & { authors: string; tags: string; quotes: string; year: string }

const blank = (): Draft => ({ title: '', authors: '', year: '', venue: '', doi: '', url: '', arxivId: '', tags: '', status: 'toread', summary: '', quotes: '', notes: '' })
const toDraft = (p: Paper): Draft => ({ ...p, authors: p.authors.join(', '), tags: p.tags.join(', '), quotes: p.quotes.join('\n'), year: p.year == null ? '' : String(p.year) })
const splitList = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean)

export function PaperForm({ open, onClose, paper, onSave }: Props) {
  const t = useT()
  const [d, setD] = useState<Draft>(blank)
  const [ref, setRef] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setD(paper ? toDraft(paper) : blank())
    setRef('')
    setFetchError(false)
  }, [open, paper])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const valid = d.title.trim().length > 0

  const lookup = async () => {
    const parsed = parsePaperRef(ref)
    setFetchError(false)
    if (!parsed) { setFetchError(true); return }
    setFetching(true)
    try {
      const meta = await fetchPaperMeta(parsed)
      if (!meta) { setFetchError(true); return }
      setD((x) => ({ ...x, title: meta.title || x.title, authors: meta.authors.join(', ') || x.authors, year: meta.year == null ? x.year : String(meta.year), venue: meta.venue || x.venue, doi: meta.doi || x.doi, url: meta.url || x.url, arxivId: meta.arxivId || x.arxivId }))
    } finally { setFetching(false) }
  }

  const save = async () => {
    if (!valid) return
    setBusy(true)
    try {
      await onSave({
        title: d.title.trim(), authors: splitList(d.authors, /[,;\n]/), year: d.year.trim() ? Number(d.year) : null, venue: d.venue.trim(),
        doi: d.doi.trim(), url: d.url.trim(), arxivId: d.arxivId.trim(), tags: splitList(d.tags, /[,;\s#]+/), status: d.status,
        summary: d.summary.trim(), quotes: splitList(d.quotes, /\n/), notes: d.notes.trim(),
      })
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={t(paper ? 'papers.edit' : 'papers.add')}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
        <Button onClick={save} disabled={!valid || busy}>{t('common.save')}</Button>
      </>}>
      <div className="space-y-3">
        {!paper && (
          <div className="rounded-card border border-line-strong p-3">
            <div className="flex items-end gap-2">
              <Input label={t('papers.ref')} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="10.1038/… · arXiv:1706.03762" className="font-mono text-sm" autoFocus />
              <Button variant="secondary" onClick={() => void lookup()} disabled={!ref.trim() || fetching} className="shrink-0">{fetching ? t('papers.fetching') : t('papers.fetch')}</Button>
            </div>
            {fetchError && <p className="mt-2 text-xs text-danger">{t('papers.fetchFailed')}</p>}
          </div>
        )}
        <Input label={t('papers.paperTitle')} value={d.title} onChange={(e) => set('title', e.target.value)} error={!valid && d.title !== '' ? t('papers.errTitle') : undefined} />
        <Input label={t('papers.authors')} value={d.authors} onChange={(e) => set('authors', e.target.value)} hint={t('papers.authorsHint')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('papers.year')} type="number" inputMode="numeric" value={d.year} onChange={(e) => set('year', e.target.value)} />
          <Input label={t('papers.venue')} value={d.venue} onChange={(e) => set('venue', e.target.value)} />
          <Input label={t('papers.doi')} value={d.doi} onChange={(e) => set('doi', e.target.value)} className="font-mono text-sm" />
          <Input label={t('papers.url')} value={d.url} onChange={(e) => set('url', e.target.value)} inputMode="url" />
        </div>
        <Input label={t('papers.tags')} value={d.tags} onChange={(e) => set('tags', e.target.value)} hint={t('papers.authorsHint')} />
        <div>
          <span className="mb-1 block text-sm font-semibold">{t('papers.status')}</span>
          <Segmented label={t('papers.status')} value={d.status} onChange={(status: PaperStatus) => set('status', status)}
            options={PAPER_STATUSES.map((s) => ({ value: s, label: t(`papers.s_${s}`) }))} />
        </div>
        <Input label={t('papers.summary')} value={d.summary} onChange={(e) => set('summary', e.target.value)} />
        <Textarea label={t('papers.quotes')} rows={3} value={d.quotes} onChange={(e) => set('quotes', e.target.value)} hint={t('papers.quotesHint')} />
        <Textarea label={t('papers.notes')} rows={4} value={d.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </Modal>
  )
}
