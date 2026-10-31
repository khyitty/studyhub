import { useEffect, useRef, type ReactNode } from 'react'
import { ProfileContext, useProfileDoc } from './useProfile'
import { LangContext } from '../i18n/useT'
import { useCategories } from '../features/todos/useCategories'
import { useKinds } from '../features/timetable/useKinds'
import { DEFAULT_KINDS, shouldSeedKinds } from '../lib/kinds'
import { DEFAULT_CATEGORIES, shouldSeedCategories } from '../lib/categories'
import type { Hue } from '../lib/theme'

function applyTheme(theme: 'system' | 'light' | 'dark', hue: Hue) {
  document.documentElement.dataset.hue = hue
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#111111' : '#ffffff')
}

/** Creates the default categories once per user (also for users who existed before categories shipped). */
function useSeedCategories(ctx: ReturnType<typeof useProfileDoc>) {
  const { categories, put, loading } = useCategories()
  const seeded = useRef(false)
  const { profile, update } = ctx
  useEffect(() => {
    if (seeded.current) return
    if (!shouldSeedCategories(profile, categories, loading, ctx.loading)) return
    seeded.current = true
    void Promise.all(DEFAULT_CATEGORIES.map(put)).then(() => update({ categoriesSeeded: true }))
  }, [profile, categories, loading, ctx.loading, put, update])
}

/** Creates the default schedule kinds once per user (phase-1 items keep working through the legacy mapping). */
function useSeedKinds(ctx: ReturnType<typeof useProfileDoc>) {
  const { kinds, put, loading } = useKinds()
  const seeded = useRef(false)
  const { profile, update } = ctx
  useEffect(() => {
    if (seeded.current) return
    if (!shouldSeedKinds(profile, kinds, loading, ctx.loading)) return
    seeded.current = true
    void Promise.all(DEFAULT_KINDS.map(put)).then(() => update({ kindsSeeded: true }))
  }, [profile, kinds, loading, ctx.loading, put, update])
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const ctx = useProfileDoc()
  const { theme, themeHue, appName, lang } = ctx.profile
  useSeedCategories(ctx)
  useSeedKinds(ctx)

  useEffect(() => {
    applyTheme(theme, themeHue)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system', themeHue)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme, themeHue])

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
