import { NavLink } from 'react-router'
import { useT } from '../../i18n/useT'
import { TAB_NAV } from './nav'

export function TabBar() {
  const t = useT()
  return (
    <nav aria-label="main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      <ul className="flex pb-[env(safe-area-inset-bottom)]">
        {TAB_NAV.map(({ to, key, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? 'text-s6' : 'text-ink-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
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
