import { useCallback } from 'react'
import { useUserCollection } from '../../data/useUserCollection'
import { itemsOnDate, normalizeScheduleItem, type ScheduleItem } from './schedule'

export { validateScheduleItem, itemsOnDate } from './schedule'
export type { ScheduleItem } from './schedule'

export type NewScheduleItem = Omit<ScheduleItem, 'id'>

export function useSchedule() {
  const col = useUserCollection<ScheduleItem>('schedule', normalizeScheduleItem)
  const add = useCallback(async (item: NewScheduleItem) => { await col.add(item) }, [col])
  const update = useCallback((id: string, patch: Partial<NewScheduleItem>) => col.update(id, patch), [col])
  const remove = useCallback((id: string) => col.remove(id), [col])
  const onDate = useCallback((iso: string) => itemsOnDate(col.items, iso), [col.items])
  return { items: col.items, add, update, remove, onDate, loading: col.loading }
}

export type Schedule = ReturnType<typeof useSchedule>
