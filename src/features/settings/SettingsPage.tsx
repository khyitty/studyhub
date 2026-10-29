import { useEffect, useRef, useState } from 'react'
import { Button, Card, Input, useToast } from '../../components/ui'
import { PageTitle } from '../../components/layout/Placeholder'
import { IconDownload, IconLogout, IconUpload } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { useProfile, type Profile } from '../../data/useProfile'
import { useAuth, useUid } from '../auth/AuthProvider'
import { isTermCode } from '../../lib/parsers/termCode'
import { GRADES, type Grade } from '../../lib/types'
import { GPA_EXCLUDED } from '../../lib/gpa'
import { exportAll, importAll } from './exportImport'

const SCALE_GRADES = GRADES.filter((g) => !GPA_EXCLUDED.includes(g))

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-pill bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 flex-1 rounded-pill text-sm font-semibold transition ${value === o.value ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

type Draft = Pick<Profile, 'appName' | 'currentTerm' | 'termStart' | 'termEnd' | 'gradReq' | 'gpaPortal' | 'gpa4Scale'>
const pick = (p: Profile): Draft => ({
  appName: p.appName, currentTerm: p.currentTerm, termStart: p.termStart, termEnd: p.termEnd,
  gradReq: { ...p.gradReq }, gpaPortal: p.gpaPortal, gpa4Scale: { ...p.gpa4Scale },
})

export function SettingsPage() {
  const t = useT()
  const toast = useToast()
  const uid = useUid()
  const { signOut, user } = useAuth()
  const { profile, update } = useProfile()
  const [draft, setDraft] = useState<Draft>(() => pick(profile))
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!dirty) setDraft(pick(profile)) }, [profile, dirty])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft((d) => ({ ...d, [k]: v })); setDirty(true) }
  const num = (s: string) => (s === '' ? 0 : Number(s))
  const termErr = draft.currentTerm && !isTermCode(draft.currentTerm) ? t('settings.termCodeHint') : undefined

  const save = async () => {
    if (termErr) return
    setBusy(true)
    try {
      await update({ ...draft, appName: draft.appName.trim() || 'StudyHub' })
      setDirty(false)
      toast.show(t('common.saved'))
    } catch (e) {
      toast.show(`${t('common.error')}: ${(e as Error).message}`)
    } finally { setBusy(false) }
  }

  const doExport = async () => {
    setBusy(true)
    try {
      const blob = await exportAll(uid)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `studyhub-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally { setBusy(false) }
  }

  const doImport = async (file: File | undefined) => {
    if (!file) return
    if (!window.confirm(t('settings.importConfirm'))) return
    setBusy(true)
    try {
      await importAll(uid, await file.text())
      setDirty(false)
      toast.show(t('settings.importDone'))
    } catch (e) {
      toast.show(t('settings.importError', { msg: (e as Error).message }))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <PageTitle>{t('settings.title')}</PageTitle>
      <div className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Input label={t('settings.appName')} value={draft.appName} onChange={(e) => set('appName', e.target.value)} maxLength={20} />
            <div>
              <span className="mb-1 block text-sm font-semibold">{t('settings.language')}</span>
              <Segmented label={t('settings.language')} value={profile.lang} onChange={(lang) => void update({ lang })}
                options={[{ value: 'ko', label: '한국어' }, { value: 'en', label: 'English' }]} />
            </div>
            <div>
              <span className="mb-1 block text-sm font-semibold">{t('settings.theme')}</span>
              <Segmented label={t('settings.theme')} value={profile.theme} onChange={(theme) => void update({ theme })}
                options={[{ value: 'system', label: t('settings.themeSystem') }, { value: 'light', label: t('settings.themeLight') }, { value: 'dark', label: t('settings.themeDark') }]} />
            </div>
          </div>
        </Card>

        <Card title={t('settings.currentTerm')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label={t('settings.termCode')} value={draft.currentTerm} onChange={(e) => set('currentTerm', e.target.value.trim())} hint={t('settings.termCodeHint')} error={termErr} inputMode="text" />
            <Input label={t('settings.termStart')} type="date" value={draft.termStart} onChange={(e) => set('termStart', e.target.value)} />
            <Input label={t('settings.termEnd')} type="date" value={draft.termEnd} onChange={(e) => set('termEnd', e.target.value)} />
          </div>
        </Card>

        <Card title={t('settings.gradReq')}>
          <div className="grid grid-cols-3 gap-3">
            {(['total', 'major', 'liberal'] as const).map((k) => (
              <Input key={k} label={t(`settings.req${k[0].toUpperCase()}${k.slice(1)}`)} type="number" inputMode="numeric" min={0}
                value={draft.gradReq[k] || ''} onChange={(e) => set('gradReq', { ...draft.gradReq, [k]: num(e.target.value) })} />
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-muted">{t('settings.gradReqHint')}</p>
          <div className="mt-4">
            <Input label={t('settings.portalGpa')} type="number" inputMode="decimal" step="0.01" min={0} max={4.5} hint={t('settings.portalGpaHint')}
              value={draft.gpaPortal ?? ''} onChange={(e) => set('gpaPortal', e.target.value === '' ? null : Number(e.target.value))} />
          </div>
        </Card>

        <details className="rounded-card bg-surface p-4 shadow-soft">
          <summary className="min-h-11 cursor-pointer font-bold">{t('settings.scale4')}</summary>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {SCALE_GRADES.map((g: Grade) => (
              <Input key={g} label={g} type="number" inputMode="decimal" step="0.1" min={0} max={4}
                value={draft.gpa4Scale[g]} onChange={(e) => set('gpa4Scale', { ...draft.gpa4Scale, [g]: Number(e.target.value) })} />
            ))}
          </div>
        </details>

        <Button onClick={save} disabled={!dirty || busy || !!termErr} className="w-full">{t('common.save')}</Button>

        <Card title={t('settings.data')}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={doExport} disabled={busy} className="flex-1"><IconDownload size={18} />{t('settings.export')}</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy} className="flex-1"><IconUpload size={18} />{t('settings.import')}</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void doImport(e.target.files?.[0])} />
          </div>
        </Card>

        <Card title={t('settings.account')}>
          <div className="flex items-center gap-3">
            {user?.photoURL && <img src={user.photoURL} alt="" className="h-10 w-10 rounded-pill" referrerPolicy="no-referrer" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{user?.displayName}</p>
              <p className="truncate text-sm text-ink-muted">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}><IconLogout size={18} />{t('settings.signOut')}</Button>
          </div>
        </Card>
      </div>
    </>
  )
}
