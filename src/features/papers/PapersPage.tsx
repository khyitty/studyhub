import { useState } from 'react'
import { Button, EmptyState, Input, Modal, PageHeader } from '../../components/ui'
import { IconPaper, IconPlus } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { PAPER_STATUSES, allTags, filterPapers, type PaperFilter } from '../../lib/papers'
import type { Paper, PaperStatus } from '../../lib/types'
import { usePapers } from './usePapers'
import { PaperList } from './PaperList'
import { PaperForm } from './PaperForm'
import { PaperDetail } from './PaperDetail'

const pill = (on: boolean) => `min-h-9 rounded-pill border px-3 text-[13px] font-semibold transition ${on ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-ink-muted hover:text-ink'}`

export function PapersPage() {
  const t = useT()
  const { papers, add, update, remove, setStatus, loading } = usePapers()
  const [status, setStatusFilter] = useState<PaperStatus | 'all'>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Paper | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)

  const filter: PaperFilter = { status, tag, q }
  const visible = filterPapers(papers, filter)
  const tags = allTags(papers)
  const opened = openedId ? papers.find((p) => p.id === openedId) ?? null : null
  const count = (s: PaperStatus | 'all') => (s === 'all' ? papers.length : papers.filter((p) => p.status === s).length)

  return (
    <>
      <PageHeader title={t('papers.title')} subtitle={papers.length ? t('papers.subtitle', { n: papers.length, read: count('read') }) : undefined}
        action={<Button size="sm" onClick={() => setAdding(true)}><IconPlus size={16} />{t('papers.add')}</Button>} />

      {papers.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...PAPER_STATUSES] as const).map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatusFilter(s)} className={pill(status === s)}>
                {s === 'all' ? t('papers.all') : t(`papers.s_${s}`)} <span className="tabular-nums opacity-70">{count(s)}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((x) => (
              <button key={x} type="button" aria-pressed={tag === x} onClick={() => setTag(tag === x ? null : x)} className={pill(tag === x)}>#{x}</button>
            ))}
            <Input aria-label={t('common.search')} placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} className="min-h-9 sm:max-w-xs" />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-ink-muted">{t('common.loading')}</p>
      ) : papers.length === 0 ? (
        <EmptyState icon={<IconPaper size={32} />} title={t('papers.empty')} action={<Button onClick={() => setAdding(true)}><IconPlus size={18} />{t('papers.add')}</Button>} />
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-muted">{t('common.empty')}</p>
      ) : (
        <PaperList papers={visible} onOpen={(p) => setOpenedId(p.id)} />
      )}

      <Modal open={opened != null} onClose={() => setOpenedId(null)} title={opened?.title ?? ''}>
        {opened && (
          <PaperDetail paper={opened}
            onEdit={() => { setOpenedId(null); setEditing(opened) }}
            onDelete={() => { void remove(opened.id); setOpenedId(null) }}
            onStatus={(s) => void setStatus(opened.id, s)} />
        )}
      </Modal>

      <PaperForm open={adding || editing != null} onClose={() => { setAdding(false); setEditing(null) }} paper={editing}
        onSave={async (p) => { if (editing) await update(editing.id, p); else await add(p) }} />
    </>
  )
}
