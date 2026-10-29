import type { ComponentType, SVGProps } from 'react'
import { IconCalendar, IconFlask, IconGrades, IconHome, IconMore, IconPaper } from '../icons'

export interface NavItem {
  to: string
  key: string
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
}

/** Order is fixed by the spec: 홈 · 학점 · 시간표 · 논문 · 연구 · 더보기 */
export const NAV: NavItem[] = [
  { to: '/', key: 'nav.home', Icon: IconHome },
  { to: '/grades', key: 'nav.grades', Icon: IconGrades },
  { to: '/timetable', key: 'nav.timetable', Icon: IconCalendar },
  { to: '/papers', key: 'nav.papers', Icon: IconPaper },
  { to: '/research', key: 'nav.research', Icon: IconFlask },
  { to: '/more', key: 'nav.more', Icon: IconMore },
]
