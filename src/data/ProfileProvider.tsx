import { useEffect, useRef, type ReactNode } from 'react'
import { ProfileContext, useProfileDoc } from './useProfile'
import { LangContext } from '../i18n/useT'
import { useCategories } from '../features/todos/useCategories'
import { DEFAULT_CATEGORIES, shouldSeedCategories } from '../lib/categories'

function applyTheme(theme: 'system' | 'light' | 'dark') {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#111111' : '#ffffff')
}

/** Creates the default categories once per user (also for users who existed before categories shipped). */
function useSeedCategories(ctx: ReturnType<typeof useProfileDoc>) {
  const { categories, add, loading } = useCategories()
  const seeded = useRef(false)
  const { profile, update } = ctx
  useEffect(() => {
    if (seeded.current) return
    if (!shouldSeedCategories(profile, categories, loading, ctx.loading)) return
    seeded.current = true
    void Promise.all(DEFAULT_CATEGORIES.map((c) => add(c.name, c.color))).then(() => update({ categoriesSeeded: true }))
  }, [profile, categories, loading, ctx.loading, add, update])
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const ctx = useProfileDoc()
  const { theme, appName, lang } = ctx.profile
  useSeedCategories(ctx)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  useEffect(() => {
    document.title = appName
    document.documentElement.lang = lang
  }, [appName, lang])

  return (
    <ProfileContext.Provider value={ctx}>
      <LangContext.Provider value={lang}>{children}</LangContext.Provider>
    </ProfileContext.Provider>
  )
}
