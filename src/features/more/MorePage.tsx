import { Link } from 'react-router'
import { useT } from '../../i18n/useT'
import { PageHeader } from '../../components/ui'
import { IconChevronRight, IconFlask, IconPaper, IconSettings } from '../../components/icons'

export function MorePage() {
  const t = useT()
  const rows = [
    { to: '/papers', label: t('nav.papers'), Icon: IconPaper },
    { to: '/research', label: t('nav.research'), Icon: IconFlask },
    { to: '/settings', label: t('nav.settings'), Icon: IconSettings },
  ]
  return (
    <>
      <PageHeader title={t('more.title')} />
      <ul className="divide-y divide-line border-y border-line">
        {rows.map(({ to, label, Icon }) => (
          <li key={to}>
            <Link to={to} className="flex min-h-14 items-center gap-3 text-sm font-medium hover:bg-surface-2/60">
              <Icon size={18} className="text-ink-muted" />
              <span className="flex-1">{label}</span>
              <IconChevronRight size={16} className="text-ink-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
