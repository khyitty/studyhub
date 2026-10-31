import { useState } from 'react'
import { Button, EmptyState, PageHeader } from '../../components/ui'
import { IconFlask, IconPlus } from '../../components/icons'
import { useT } from '../../i18n/useT'
import { projectTodos, researchCategoryId, splitProjects } from '../../lib/projects'
import type { Project } from '../../lib/types'
import { useCategories } from '../todos/useCategories'
import { useTodos } from '../todos/useTodos'
import { useProjects } from './useProjects'
import { ProjectCard } from './ProjectCard'
import { ProjectForm } from './ProjectForm'

export function ResearchPage() {
  const t = useT()
  const { projects, add, update, remove, loading } = useProjects()
  const todos = useTodos()
  const { categories } = useCategories()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const { active, rest } = splitProjects(projects)
  const researchCat = researchCategoryId(categories)
  const shade = categories.find((c) => c.id === researchCat)?.shade ?? null

  const card = (p: Project) => (
    <ProjectCard key={p.id} project={p} todos={projectTodos(todos.todos, p.id)} shade={shade} categories={categories}
      onAddTodo={(title) => todos.add(title, { categoryId: researchCat, source: { type: 'project', refId: p.id, label: p.name } })}
      onToggle={(id) => void todos.toggle(id)}
      onUpdateTodo={(id, patch) => void todos.update(id, patch)}
      onRemoveTodo={(id) => void todos.remove(id)}
      onGoal={(goal) => void update(p.id, { goal })}
      onEdit={() => setEditing(p)}
      onSetStatus={(status) => void update(p.id, { status })}
      onDelete={() => { if (window.confirm(t('research.deleteConfirm'))) void remove(p.id) }} />
  )

  return (
    <>
      <PageHeader title={t('research.title')} action={<Button size="sm" onClick={() => setAdding(true)}><IconPlus size={16} />{t('research.add')}</Button>} />

      {loading ? (
        <p className="text-center text-ink-muted">{t('common.loading')}</p>
      ) : projects.length === 0 ? (
        <EmptyState icon={<IconFlask size={32} />} title={t('research.empty')} action={<Button onClick={() => setAdding(true)}><IconPlus size={18} />{t('research.add')}</Button>} />
      ) : (
        <div className="space-y-4">
          {active.map(card)}
          {active.length === 0 && <p className="py-4 text-center text-[13px] text-ink-muted">{t('research.noActive')}</p>}
          {rest.length > 0 && (
            <details className="pt-2">
              <summary className="min-h-9 cursor-pointer list-none text-sm font-bold text-ink-muted [&::-webkit-details-marker]:hidden">{t('research.inactive', { n: rest.length })} ›</summary>
              <div className="mt-3 space-y-4">{rest.map(card)}</div>
            </details>
          )}
        </div>
      )}

      <ProjectForm open={adding || editing != null} onClose={() => { setAdding(false); setEditing(null) }} project={editing}
        onSave={async (p) => { if (editing) await update(editing.id, p); else await add(p) }} />
    </>
  )
}
