import { useState } from 'react'
import { Button, Modal, Textarea, useToast } from '../../components/ui'
import { useLang, useT } from '../../i18n/useT'
import { termLabel } from '../../lib/parsers/termCode'
import { previewImport, type Grades } from './useGrades'

type Preview = ReturnType<typeof previewImport>

export function ImportModal({ open, onClose, g }: { open: boolean; onClose: () => void; g: Grades }) {
  const t = useT()
  const lang = useLang()
  const toast = useToast()
  const [termsText, setTermsText] = useState('')
  const [coursesText, setCoursesText] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => { setPreview(null); onClose() }
  const doPreview = () => setPreview(previewImport(termsText, coursesText))
  const save = async () => {
    if (!preview) return
    setBusy(true)
    try {
      const r = await g.importPortal(termsText, coursesText)
      toast.show(t('grades.imported', { n: r.courseCount }))
      setTermsText(''); setCoursesText('')
      close()
    } catch (e) {
      toast.show(`${t('common.error')}: ${(e as Error).message}`)
    } finally { setBusy(false) }
  }

  const empty = preview != null && preview.terms.length === 0 && preview.assigned.length === 0
  const replacing = g.courses.some((c) => c.source === 'portal')

  return (
    <Modal open={open} onClose={close} title={t('grades.import')}
      footer={<>
        <Button variant="secondary" onClick={close} disabled={busy}>{t('common.cancel')}</Button>
        {preview && !empty
          ? <Button onClick={save} disabled={busy}>{t('common.save')}</Button>
          : <Button onClick={doPreview} disabled={!termsText.trim() && !coursesText.trim()}>{t('grades.preview')}</Button>}
      </>}>
      <div className="space-y-3">
        <Textarea label={t('grades.importTerms')} rows={5} value={termsText} placeholder={t('grades.pasteTermsHint')} onChange={(e) => { setTermsText(e.target.value); setPreview(null) }} className="font-mono" />
        <Textarea label={t('grades.importCourses')} rows={5} value={coursesText} placeholder={t('grades.pasteCoursesHint')} onChange={(e) => { setCoursesText(e.target.value); setPreview(null) }} className="font-mono" />
        {empty && <p className="rounded-card bg-butter px-4 py-3 text-sm font-semibold text-butter-deep">{t('grades.nothingParsed')}</p>}
        {preview && !empty && (
          <div className="space-y-2">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-muted"><tr><th className="py-1 text-left">{t('grades.term')}</th><th className="text-right">{t('grades.terms')}</th><th className="text-right">{t('grades.credits')}</th></tr></thead>
              <tbody>
                {preview.terms.map((tm) => {
                  const mine = preview.assigned.filter((c) => c.termCode === tm.code)
                  return (
                    <tr key={tm.code} className="border-t border-line">
                      <td className="py-1.5 font-semibold">{termLabel(tm.code, lang)}</td>
                      <td className="text-right tabular-nums">{t('grades.courseCount', { n: mine.length })}</td>
                      <td className="text-right tabular-nums">{t('grades.creditSum', { n: mine.reduce((s, c) => s + c.credits, 0) })}</td>
                    </tr>
                  )
                })}
                {preview.assigned.some((c) => c.termCode == null) && (
                  <tr className="border-t border-line text-butter-deep"><td className="py-1.5 font-semibold">{t('grades.unassigned')}</td>
                    <td className="text-right">{t('grades.courseCount', { n: preview.assigned.filter((c) => c.termCode == null).length })}</td><td /></tr>
                )}
              </tbody>
            </table>
            {replacing && <p className="text-xs text-ink-muted">{t('grades.replaceConfirm')}</p>}
            {preview.warnings.length > 0 && (
              <div className="rounded-card bg-butter px-4 py-3 text-sm">
                <p className="font-semibold text-butter-deep">{t('grades.warnings')}</p>
                <ul className="mt-1 list-disc pl-4 text-ink">{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
