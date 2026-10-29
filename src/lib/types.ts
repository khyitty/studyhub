export type TermCode = string // 'YYYY-1' | 'YYYY-S' | 'YYYY-2' | 'YYYY-W'

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F' | 'P' | 'NP' | 'S' | 'U'

export const GRADES: Grade[] = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'P', 'NP', 'S', 'U']

export interface Term {
  code: TermCode
  label: string
  order: number
  requested: number | null
  earned: number | null
  totalPoints: number | null
  gpaCert: number | null
  gpa: number | null
  gpa100: number | null
}

export interface ParsedCourse {
  code: string
  section: string
  name: string
  category: string
  area: string
  credits: number
  score: number | null
  grade: Grade
  point: number
}

export interface Course extends ParsedCourse {
  id: string
  termCode: TermCode | null
  source: 'portal' | 'manual'
  supersededBy: string | null
  /** display order inside a term: portal row index, or Date.now() for manual courses */
  order: number
}

export type PaletteColor = 'sky' | 'mint' | 'pink' | 'butter' | 'lilac' | 'peach'

export interface Category {
  id: string
  name: string
  color: PaletteColor
  order: number
}

export interface Todo {
  id: string
  title: string
  date: string
  done: boolean
  doneAt: string | null
  source: { type: 'general' | 'project' | 'course'; refId: string | null; label: string } | null
  createdAt: string
  /** null = 기타 (no category) */
  categoryId: string | null
}

export type ScheduleKind = 'class' | 'research' | 'work' | 'other'

export interface ScheduleItem {
  id: string
  title: string
  kind: ScheduleKind
  days: number[]
  start: string
  end: string
  place: string
  repeat: 'weekly' | 'once'
  date: string | null
  from: string
  to: string
}

export type GreReq = 'required' | 'optional' | 'none'
export type SopState = 'none' | 'todo' | 'draft' | 'done'
export type SchoolStatus = 'interested' | 'preparing' | 'submitted' | 'accepted' | 'rejected'

export interface School {
  id: string
  name: string
  /** program incl. degree, e.g. "Statistics PhD" */
  program: string
  deadline: string
  gre: GreReq
  toeflMin: number | null
  recsRequired: number
  recsDone: number
  sop: SopState
  fee: string
  status: SchoolStatus
  notes: string
  links: { title: string; url: string }[]
  professors: { name: string; note: string }[]
  createdAt: string
}
