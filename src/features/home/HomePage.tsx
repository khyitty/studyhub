import { Card } from '../../components/ui'
import { PageTitle } from '../../components/layout/Placeholder'
import { useT } from '../../i18n/useT'
import { useProfile } from '../../data/useProfile'
import { levelProgress } from '../../lib/xp'
import { useTodos } from '../todos/useTodos'
import { TodoList } from '../todos/TodoList'

/** Temporary home (Task 8): todo list + xp readout. Replaced by the full home in Task 10. */
export function HomePage() {
  const t = useT()
  const { profile } = useProfile()
  const todos = useTodos()
  const lp = levelProgress(profile.xp)
  return (
    <>
      <PageTitle>{t('nav.home')}</PageTitle>
      <p className="mb-3 text-sm text-ink-muted">{t('home.level', { level: lp.level })} · {t('home.xp', { current: lp.current, needed: lp.needed })} · {Math.round(todos.completionRatio * 100)}%</p>
      <Card title={t('home.todayTodos')}>
        <TodoList todos={todos.today} onToggle={(id) => void todos.toggle(id)} onRemove={(id) => void todos.remove(id)} onAdd={todos.add} emptyText={t('home.noTodos')} />
      </Card>
    </>
  )
}
