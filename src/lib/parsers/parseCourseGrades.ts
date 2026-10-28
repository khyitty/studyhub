import { GRADES, type Grade, type ParsedCourse } from '../types'
import { cleanLines } from './parseTermGrades'

export const KNOWN_CATEGORIES = ['교양', '전공필수', '전공선택', '학문의기초', '일반선택', '교직', '자유선택', '부전공', '이중전공', '복수전공']

const CODE = /^([A-Z]{3,4}\d{3}|\d{1,3})$/
const SECTION = /^[0-9A-Z]{2}$/
const NUMBER = /^-?\d+(\.\d+)?$/
const GRADE_SET = new Set<string>(GRADES)

function isCourseStart(lines: string[], i: number): boolean {
  return CODE.test(lines[i]) && i + 1 < lines.length && SECTION.test(lines[i + 1])
}

/** Index of the grade line that closes the block starting at `start`, or -1. */
function findBlockEnd(lines: string[], start: number): number {
  for (let j = start + 3; j + 1 < lines.length; j++) {
    if (GRADE_SET.has(lines[j]) && NUMBER.test(lines[j + 1]) && NUMBER.test(lines[j - 1])) return j
  }
  return -1
}

function parseBlock(block: string[]): ParsedCourse | null {
  if (block.length < 6) return null
  const [code, section, name, ...rest] = block
  const point = Number(rest.pop())
  const grade = rest.pop() as Grade
  if (!GRADE_SET.has(grade) || !Number.isFinite(point)) return null
  let score: number | null = null
  let credits: number
  const last = rest[rest.length - 1]
  const beforeLast = rest[rest.length - 2]
  if (rest.length >= 2 && NUMBER.test(last) && NUMBER.test(beforeLast)) {
    score = Number(rest.pop())
    credits = Number(rest.pop())
  } else {
    credits = Number(rest.pop())
  }
  if (!Number.isFinite(credits)) return null
  let category = ''
  if (rest.length && KNOWN_CATEGORIES.includes(rest[0])) category = rest.shift()!
  const area = rest.join(' ')
  return { code, section, name, category, area, credits, score, grade, point }
}

export function parseCourseGrades(text: string): ParsedCourse[] {
  const lines = cleanLines(text)
  const out: ParsedCourse[] = []
  let i = 0
  while (i < lines.length) {
    if (!isCourseStart(lines, i)) { i++; continue }
    const end = findBlockEnd(lines, i)
    if (end < 0) break
    const c = parseBlock(lines.slice(i, end + 2))
    if (c) out.push(c)
    i = end + 2
  }
  return out
}
