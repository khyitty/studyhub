import type { ScheduleItem } from '../types'

/**
 * Portal timetable paste → schedule items.
 *
 * TODO: the portal's timetable text format is not known yet. When the user pastes a sample,
 * implement the parser here (and add a fixture + test under __fixtures__). Until then this
 * returns [] and the UI shows `timetable.parserNotReady`.
 */
export function parseTimetable(_text: string): Omit<ScheduleItem, 'id'>[] {
  return []
}
