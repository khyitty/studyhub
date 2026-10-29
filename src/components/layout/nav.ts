import type { ComponentType, SVGProps } from 'react'
import { IconCalendar, IconFlask, IconGrad, IconGrades, IconHome, IconMore, IconPaper, IconSettings } from '../icons'

export interface NavItem {
  to: string
  key: string
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
}

const home: NavItem = { to: '/', key: 'nav.home', Icon: IconHome }
const grades: NavItem = { to: '/grades', key: 'nav.grades', Icon: IconGrades }
const timetable: NavItem = { to: '/timetable', key: 'nav.timetable', Icon: IconCalendar }
const papers: NavItem = { to: '/papers', key: 'nav.papers', Icon: IconPaper }
const research: NavItem = { to: '/research', key: 'nav.research', Icon: IconFlask }
const grad: NavItem = { to: '/grad', key: 'nav.grad', Icon: IconGrad }
const more: NavItem = { to: '/more', key: 'nav.more', Icon: IconMore }

/** Desktop sidebar: 홈 · 학점 · 시간표 · 논문 · 연구 · 대학원 (설정은 맨 아래 별도) */
export const SIDEBAR_NAV: NavItem[] = [home, grades, timetable, papers, research, grad]
export const SETTINGS_NAV: NavItem = { to: '/settings', key: 'nav.settings', Icon: IconSettings }
/** Mobile tab bar: 홈 · 학점 · 시간표 · 대학원 · 더보기 */
export const TAB_NAV: NavItem[] = [home, grades, timetable, grad, more]
