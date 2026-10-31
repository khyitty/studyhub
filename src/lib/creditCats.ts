import type { DocumentData } from 'firebase/firestore'
import type { Profile } from '../data/profile'
import { EARNED_EXCLUDED } from './gpa'
import type { Course, Term, TermCode } from './types'

/** A row of the credit grid (이수구분): 전공필수, 교양, … Courses match by `category` string against name or aliases. */
export interface CreditCat {
  id: string
  name: string
  /** previous names, kept so a re-pasted portal export still lands in this row */
  aliases: string[]
  /** credits required for graduation; 0 = not tracked */
  required: number
  /** counts toward the major GPA */
  isMajor: boolean
  order: number
}

export type NewCreditCat = Omit<CreditCat, 'id'>

export const OTHER_CAT_ID = '__other__'

/** Fixed ids: seeding uses setDoc, so two devices seeding at once overwrite instead of duplicating. Names match the portal (no spaces). */
export const DEFAULT_CREDIT_CATS: CreditCat[] = [
  { id: 'seed-major-req', name: '전공필수', aliases: [], required: 0, isMajor: true, order: 0 },
  { id: 'seed-major-elec', name: '전공선택', aliases: [], required: 0, isMajor: true, order: 1 },
  { id: 'seed-liberal', name: '교양', aliases: [], required: 0, isMajor: false, order: 2 },
  { id: 'seed-basic', name: '학문의기초', aliases: [], required: 0, isMajor: false, order: 3 },
]

export function normalizeCreditCat(raw: DocumentData, id: string): CreditCat {
  return {
    id,
    name: String(raw.name ?? ''),
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(String) : [],
    required: typeof raw.required === 'number' && Number.isFinite(raw.required) ? raw.required : 0,
    isMajor: Boolean(raw.isMajor),
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : 0,
  }
}

export function matchesCat(cat: CreditCat, category: string): boolean {
  return cat.name === category || cat.aliases.includes(category)
}

export function catFor(cats: CreditCat[], category: string): CreditCat | null {
  return cats.find((c) => matchesCat(c, category)) ?? null
}

/** First-time rows: the distinct categories of existing courses in portal order; defaults when there are no courses. */
export function seedCatsFromCourses(courses: Course[], terms: Pick<Term, 'code' | 'order'>[]): CreditCat[] {
  if (courses.length === 0) return DEFAULT_CREDIT_CATS
  const termOrder = new Map(terms.map((t) => [t.code, t.order]))
  const sorted = [...courses].sort((a, b) => {
    const ta = a.termCode ? termOrder.get(a.termCode) ?? Infinity : Infinity
    const tb = b.termCode ? termOrder.get(b.termCode) ?? Infinity : Infinity
    return ta - tb || a.order - b.order
  })
  const names: string[] = []
  for (const c of sorted) if (c.category && !names.includes(c.category)) names.push(c.category)
  return names.map((name, i) => ({ id: `seed-${i}`, name, aliases: [], required: 0, isMajor: name.includes('전공'), order: i }))
}

export function shouldSeedCreditCats(
  profile: Pick<Profile, 'creditCatsSeeded'>, cats: CreditCat[], catsLoading: boolean, coursesLoading: boolean, profileLoading: boolean,
): boolean {
  if (catsLoading || coursesLoading || profileLoading) return false
  if (profile.creditCatsSeeded === true) return false
  return cats.length === 0
}

/** Renaming a row: remember the old name and rewrite the courses that matched the old name or an alias. */
export function renamePlan(cat: CreditCat, newName: string, courses: Course[]): { catPatch: { name: string; aliases: string[] }; courseIds: string[] } {
  const aliases = cat.aliases.includes(cat.name) || cat.name === newName ? cat.aliases.filter((a) => a !== newName) : [...cat.aliases.filter((a) => a !== newName), cat.name]
  return {
    catPatch: { name: newName, aliases },
    courseIds: courses.filter((c) => matchesCat(cat, c.category) && c.category !== newName).map((c) => c.id),
  }
}

/** Names (and aliases) of the rows that count toward the major GPA. */
export function majorNames(cats: CreditCat[]): string[] {
  return cats.filter((c) => c.isMajor).flatMap((c) => [c.name, ...c.aliases])
}

export interface GridRow {
  id: string
  /** null = the virtual "기타" row */
  cat: CreditCat | null
  /** every course in the row, superseded ones included (rendered struck through) */
  courses: Course[]
  /** credits earned by active, passing courses */
  earned: number
}

export function gridRows(cats: CreditCat[], courses: Course[]): GridRow[] {
  const sorted = [...cats].sort((a, b) => a.order - b.order)
  const rows: GridRow[] = sorted.map((cat) => ({ id: cat.id, cat, courses: [], earned: 0 }))
  const other: GridRow = { id: OTHER_CAT_ID, cat: null, courses: [], earned: 0 }
  for (const c of courses) {
    const row = rows.find((r) => r.cat && matchesCat(r.cat, c.category)) ?? other
    row.courses.push(c)
    if (c.supersededBy == null && !EARNED_EXCLUDED.includes(c.grade)) row.earned += c.credits
  }
  rows.push(other)
  return rows
}

/** Courses of a row in one term column (null = the unassigned column), in display order. */
export function cellCourses(row: GridRow, termCode: TermCode | null): Course[] {
  return row.courses.filter((c) => c.termCode === termCode).sort((a, b) => a.order - b.order)
}

/** Grid column header: 'n학년 1학기' / 'Y1 Spring'; seasonal terms keep the year. */
export function gridTermLabel(code: TermCode, firstYear: number, lang: 'ko' | 'en'): string {
  const [yearStr, season] = code.split('-')
  const year = Number(yearStr)
  if (season === 'S' || season === 'W') {
    const name = lang === 'ko' ? (season === 'S' ? '여름' : '겨울') : season === 'S' ? 'Summer' : 'Winter'
    return `${year} ${name}`
  }
  const grade = year - firstYear + 1
  if (lang === 'ko') return `${grade}학년 ${season}학기`
  return `Y${grade} ${season === '1' ? 'Spring' : 'Fall'}`
}
