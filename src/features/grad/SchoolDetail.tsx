import { Button } from '../../components/ui'
import { useT } from '../../i18n/useT'
import type { School } from '../../lib/types'

export function SchoolDetail({ school, onEdit, onDelete }: { school: School; onEdit: () => void; onDelete: () => void }) {
  const t = useT()
  const del = () => { if (window.confirm(t('grad.deleteConfirm'))) onDelete() }
  const empty = !school.notes && school.links.length === 0 && school.professors.length === 0
  return (
    <div className="space-y-3 text-[13px]">
      {school.notes && <p className="whitespace-pre-wrap">{school.notes}</p>}
      {school.links.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-ink-muted">{t('grad.links')}</p>
          <ul className="mt-1 space-y-0.5">
            {school.links.map((l, i) => (
              <li key={i}><a href={l.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:decoration-ink">{l.title || l.url}</a></li>
            ))}
          </ul>
        </div>
      )}
      {school.professors.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-ink-muted">{t('grad.professors')}</p>
          <ul className="mt-1 space-y-0.5">
            {school.professors.map((p, i) => (
              <li key={i}><span className="font-semibold">{p.name}</span>{p.note && <span className="text-ink-muted"> · {p.note}</span>}</li>
            ))}
          </ul>
        </div>
      )}
      {empty && <p className="text-ink-muted">{t('common.empty')}</p>}
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="secondary" onClick={onEdit}>{t('common.edit')}</Button>
        <Button size="sm" variant="danger" onClick={del}>{t('common.delete')}</Button>
      </div>
    </div>
  )
}
