import { useState } from 'react'
import { Button, EmptyState, Modal, PageHeader, Segmented } from '../../components/ui'
import { IconGrad, IconPlus } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import { todayISO } from '../../lib/dates'
import { filterSchools, gradSubtitle, sortSchools, type SortKey, type StatusFilter } from '../../lib/schools'
import { useIsDesktop } from '../../lib/useIsDesktop'
import type { School } from '../../lib/types'
import { useSchools } from './useSchools'
import { SchoolTable } from './SchoolTable'
import { SchoolCards } from './SchoolCards'
import { SchoolDetail } from './SchoolDetail'
import { SchoolForm } from './SchoolForm'

const FILTERS: StatusFilter[] = ['all', 'interested', 'preparing', 'submitted', 'result']

export function GradPage() {
  const t = useT()
  const { schools, add, update, remove, loading } = useSchools()
  const { profile } = useProfile()
  const desktop = useIsDesktop()
  const today = todayISO()
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('deadline')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<School | null>(null)
  const [adding, setAdding] = useState(false)
  const [opened, setOpened] = useState<School | null>(null)

  const visible = sortSchools(filterSchools(schools, filter), sortKey, today)
  const count = (f: StatusFilter) => filterSchools(schools, f).length
  const filterLabel = (f: StatusFilter) => (f === 'all' ? t('grad.all') : f === 'result' ? t('grad.result') : t(`grad.s_${f}`))
  const showCards = !desktop || view === 'cards'
  const current = opened ? schools.find((s) => s.id === opened.id) ?? null : null

  const onDelete = async (id: string) => {
    await remove(id)
    setExpandedId((x) => (x === id ? null : x))
    setOpened((x) => (x?.id === id ? null : x))
  }
  const onEdit = (s: School) => { setOpened(null); setEditing(s) }

  return (
    <>
      <PageHeader title={t('grad.title')} subtitle={gradSubtitle(schools, today, t) || undefined}
        action={<>
          {desktop && <Segmented label={t('grad.view')} value={view} onChange={setView} options={[{ value: 'table', label: t('grad.table') }, { value: 'cards', label: t('grad.cards') }]} />}
          <Button size="sm" onClick={() => setAdding(true)}><IconPlus size={16} />{t('grad.add')}</Button>
        </>} />

      {schools.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
              className={`min-h-9 rounded-pill border px-3 text-[13px] font-semibold transition ${filter === f ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-ink-muted hover:text-ink'}`}>
              {filterLabel(f)} <span className="tabular-nums opacity-70">{count(f)}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center text-ink-muted">{t('common.loading')}</p>
      ) : schools.length === 0 ? (
        <EmptyState icon={<IconGrad size={32} />} title={t('grad.empty')} action={<Button onClick={() => setAdding(true)}><IconPlus size={18} />{t('grad.add')}</Button>} />
      ) : showCards ? (
        <SchoolCards schools={visible} today={today} mine={profile.toeflScore} onOpen={setOpened} />
      ) : (
        <>
          <SchoolTable schools={visible} today={today} mine={profile.toeflScore} sortKey={sortKey} onSort={setSortKey}
            expandedId={expandedId} onToggle={(id) => setExpandedId((x) => (x === id ? null : id))} onEdit={onEdit} onDelete={(id) => void onDelete(id)} />
          <p className="mt-2 text-xs text-ink-muted">{t('grad.sortHint')}</p>
        </>
      )}

      <Modal open={current != null} onClose={() => setOpened(null)} title={current?.name ?? ''}>
        {current && <>
          <p className="mb-3 text-[13px] text-ink-muted">{current.program}</p>
          <SchoolDetail school={current} onEdit={() => onEdit(current)} onDelete={() => void onDelete(current.id)} />
        </>}
      </Modal>

      <SchoolForm open={adding || editing != null} onClose={() => { setAdding(false); setEditing(null) }} school={editing}
        onSave={async (data) => { if (editing) await update(editing.id, data); else await add(data) }} />
    </>
  )
}
