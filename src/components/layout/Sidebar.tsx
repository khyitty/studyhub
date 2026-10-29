import { NavLink } from 'react-router'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import { NAV } from './nav'

export function Sidebar() {
  const t = useT()
  const { profile } = useProfile()
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-surface px-3 py-6 md:flex">
      <div className="mb-6 px-3 text-xl font-bold">{profile.appName}</div>
      <nav aria-label="main">
        <ul className="space-y-1">
          {NAV.map(({ to, key, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-pill px-3 font-semibold transition ${isActive ? 'bg-peach text-peach-deep' : 'text-ink-muted hover:bg-surface-2'}`
                }
              >
                <Icon size={20} />
                {t(key)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
