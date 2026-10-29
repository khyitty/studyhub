import { EmptyState, PageHeader } from '../ui'
import { useT } from '../../i18n/useT'
import { IconSparkle } from '../icons'

/** Screen for a feature that ships in a later phase. */
export function Placeholder({ titleKey }: { titleKey: string }) {
  const t = useT()
  return (
    <>
      <PageHeader title={t(titleKey)} />
      <EmptyState icon={<IconSparkle size={28} />} title={t('common.comingSoon')} />
    </>
  )
}
