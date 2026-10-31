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

/** Theme shade: 1 = lightest … 6 = darkest (light mode). */
export type Shade = 1 | 2 | 3 | 4 | 5 | 6

export interface Category {
  id: string
  name: string
  shade: Shade
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

export interface ScheduleItem {
  id: string
  title: string
  /** id of a `kinds` document (legacy 'class|research|work|other' is mapped on read) */
  kind: string
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

export type PaperStatus = 'toread' | 'reading' | 'read'

export interface Paper {
  id: string
  title: string
  authors: string[]
  year: number | null
  venue: string
  doi: string
  url: string
  arxivId: string
  tags: string[]
  status: PaperStatus
  /** one-line summary */
  summary: string
  /** key quotes, one per entry */
  quotes: string[]
  notes: string
  addedAt: string
  readAt: string | null
}

export type ProjectStatus = 'active' | 'paused' | 'done'

/** A research project on the board; its todos are plain todos with `source: { type: 'project', refId }`. */
export interface Project {
  id: string
  name: string
  /** this week's one-line goal */
  goal: string
  status: ProjectStatus
  note: string
  order: number
  createdAt: string
}
