import { Card } from '../../components/ui'
import { useT } from '../../i18n/useT'
import { TodoList } from '../todos/TodoList'
import type { useTodos } from '../todos/useTodos'

export function TodayTodos({ todos }: { todos: ReturnType<typeof useTodos> }) {
  const t = useT()
  return (
    <Card title={t('home.todayTodos')}>
      <TodoList
        todos={todos.today}
        onToggle={(id) => void todos.toggle(id)}
        onRemove={(id) => void todos.remove(id)}
        onAdd={todos.add}
        emptyText={t('home.noTodos')}
      />
    </Card>
  )
}
