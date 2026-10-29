import { Link } from 'react-router'
import { useT } from '../../i18n/useT'
import { PageTitle } from '../../components/layout/Placeholder'
import { IconChevronRight, IconClock, IconSend, IconSettings } from '../../components/icons'

export function MorePage() {
  const t = useT()
  const rows = [
    { to: '/settings', label: t('more.settings'), Icon: IconSettings, ready: true },
    { to: '/more', label: t('more.deadlines'), Icon: IconClock, ready: false },
    { to: '/more', label: t('more.gradSchool'), Icon: IconSend, ready: false },
  ]
  return (
    <>
      <PageTitle>{t('more.title')}</PageTitle>
      <ul className="overflow-hidden rounded-card bg-surface shadow-soft">
        {rows.map(({ to, label, Icon, ready }) => (
          <li key={label} className="border-b border-line last:border-0">
            {ready ? (
              <Link to={to} className="flex min-h-14 items-center gap-3 px-4 font-semibold hover:bg-surface-2">
                <Icon size={20} className="text-peach-deep" />
                <span className="flex-1">{label}</span>
                <IconChevronRight size={18} className="text-ink-muted" />
              </Link>
            ) : (
              <div className="flex min-h-14 items-center gap-3 px-4 font-semibold text-ink-muted" aria-disabled="true">
                <Icon size={20} />
                <span className="flex-1">{label}</span>
                <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs">{t('common.comingSoon')}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
