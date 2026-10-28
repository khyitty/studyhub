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
}
