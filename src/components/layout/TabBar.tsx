import { NavLink } from 'react-router'
import { useT } from '../../i18n/useT'
import { NAV } from './nav'

export function TabBar() {
  const t = useT()
  return (
    <nav aria-label="main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      <ul className="flex pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ to, key, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${isActive ? 'text-peach-deep' : 'text-ink-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-10 items-center justify-center rounded-pill transition ${isActive ? 'bg-peach' : ''}`}>
                    <Icon size={20} />
                  </span>
                  {t(key)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
