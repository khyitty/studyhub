import type { Term } from '../types'
import { termCodeFromLabel, termOrder } from './termCode'

const HEADER = /^\d{4}학년도\s*.+$/
const FIELDS = ['requested', 'earned', 'totalPoints', 'gpaCert', 'gpa', 'gpa100'] as const

export function cleanLines(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
}

function num(s: string | undefined): number | null {
  if (s === undefined) return null
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function parseTermGrades(text: string): Term[] {
  const lines = cleanLines(text)
  const terms: Term[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!HEADER.test(lines[i])) continue
    const label = lines[i]
    const values: string[] = []
    let j = i + 1
    while (j < lines.length && values.length < FIELDS.length && !HEADER.test(lines[j])) {
      values.push(lines[j])
      j++
    }
    const code = termCodeFromLabel(label)
    const term: Term = {
      code, label, order: termOrder(code),
      requested: null, earned: null, totalPoints: null, gpaCert: null, gpa: null, gpa100: null,
    }
    FIELDS.forEach((f, k) => { term[f] = num(values[k]) })
    terms.push(term)
    i = j - 1
  }
  return terms.sort((a, b) => a.order - b.order)
}
