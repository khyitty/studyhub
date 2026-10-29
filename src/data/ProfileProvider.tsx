import { useEffect, type ReactNode } from 'react'
import { ProfileContext, useProfileDoc } from './useProfile'
import { LangContext } from '../i18n/useT'

function applyTheme(theme: 'system' | 'light' | 'dark') {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#1f1d26' : '#fffbf3')
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const ctx = useProfileDoc()
  const { theme, appName, lang } = ctx.profile

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
