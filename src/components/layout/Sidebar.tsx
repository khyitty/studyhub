import { NavLink } from 'react-router'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import { SETTINGS_NAV, SIDEBAR_NAV, type NavItem } from './nav'

function Item({ item: { to, key: k, Icon } }: { item: NavItem }) {
  const t = useT()
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex min-h-10 items-center gap-2.5 rounded-card px-2.5 text-sm font-medium transition ${isActive ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:bg-surface-2/60 hover:text-ink'}`
      }
    >
      <Icon size={17} />
      {t(k)}
    </NavLink>
  )
}

export function Sidebar() {
  const { profile } = useProfile()
  return (
    <aside className="sticky top-0 hidden h-dvh w-[190px] shrink-0 flex-col border-r border-line bg-surface px-3.5 py-6 md:flex">
      <div className="px-2.5 pb-4 text-[17px] font-extrabold tracking-[-0.3px]">{profile.appName}</div>
      <nav aria-label="main" className="flex flex-1 flex-col">
        <ul className="space-y-0.5">
          {SIDEBAR_NAV.map((item) => (
            <li key={item.to}><Item item={item} /></li>
          ))}
        </ul>
        <ul className="mt-auto">
          <li><Item item={SETTINGS_NAV} /></li>
        </ul>
      </nav>
    </aside>
  )
}
