import { useT } from '../../i18n/useT'
import type { TodoGroup } from '../../lib/categories'
import { SHADE_CLASS, textShade } from '../../lib/theme'
import { formatShortDate } from '../../lib/dates'
import type { Category, Todo } from '../../lib/types'
import { AddTodoRow } from '../todos/AddTodoRow'
import { TodoRow } from '../todos/TodoRow'

type Props = {
  groups: TodoGroup[]
  categories: Category[]
  selected: string
  isToday: boolean
  stats: { done: number; total: number }
  onToggle: (id: string) => void
  onAdd: (title: string, categoryId: string | null) => Promise<void>
  onUpdate: (id: string, patch: Partial<Pick<Todo, 'title' | 'categoryId' | 'date'>>) => void
  onRemove: (id: string) => void
  onManage: () => void
}

export function CategoryTodos({ groups, categories, selected, isToday, stats, onToggle, onAdd, onUpdate, onRemove, onManage }: Props) {
  const t = useT()
  const title = isToday ? t('home.todayTodos') : `${formatShortDate(selected)} ${t('home.todos')}`
  return (
    <section>
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold">
          {title} <span className="ml-1 font-semibold text-ink-muted tabular-nums">{stats.done} / {stats.total}</span>
        </h2>
        <button type="button" onClick={onManage} aria-label={t('home.manageCategories')}
          className="flex h-9 w-9 items-center justify-center rounded-card text-ink-muted hover:bg-surface-2">
          <span aria-hidden="true" className="text-base leading-none">⋯</span>
        </button>
      </header>
      <div className="mt-2 space-y-5">
        {groups.map((g) => {
          const shade = g.category?.shade ?? null
          const label = g.category ? g.category.name : t('home.other')
          return (
            <div key={g.id}>
              <h3 className={`text-xs font-bold ${shade ? SHADE_CLASS[textShade(shade)].text : 'text-ink-muted'}`}>{label}</h3>
              <ul className="mt-1">
                {g.todos.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} shade={shade} categories={categories}
                    onToggle={() => onToggle(todo.id)} onUpdate={(p) => onUpdate(todo.id, p)} onRemove={() => onRemove(todo.id)} />
                ))}
                <AddTodoRow onAdd={(title) => onAdd(title, g.category?.id ?? null)} />
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
