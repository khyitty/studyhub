import { EmptyState } from '../ui'
import { useT } from '../../i18n/useT'
import { IconSparkle } from '../icons'

export function PageTitle({ children }: { children: string }) {
  return <h1 className="mb-4 text-2xl font-bold">{children}</h1>
}

/** Screen for a feature that ships in a later phase. */
export function Placeholder({ titleKey }: { titleKey: string }) {
  const t = useT()
  return (
    <>
      <PageTitle>{t(titleKey)}</PageTitle>
      <EmptyState icon={<IconSparkle size={28} />} title={t('common.comingSoon')} />
    </>
  )
}
