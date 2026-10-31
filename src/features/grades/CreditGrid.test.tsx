import { fireEvent, render, screen } from '@testing-library/react'
import { CreditGrid } from './CreditGrid'
import { DEFAULT_CREDIT_CATS, gridRows } from '../../lib/creditCats'
import { activeCourses } from '../../lib/gpa'
import type { Course, Grade, TermCode } from '../../lib/types'
import type { TermDoc } from './useGrades'

const c = (id: string, category: string, termCode: TermCode | null, credits = 3, grade: Grade = 'A'): Course => ({
  id, code: id.toUpperCase(), section: '00', name: id, category, area: '', credits, score: null, grade,
  point: grade === 'A+' ? 4.5 : 4, termCode, source: 'portal', supersededBy: null, order: 0,
})
const term = (code: string, order: number): TermDoc => ({ id: code, code, label: code, order, requested: null, earned: null, totalPoints: null, gpaCert: null, gpa: null, gpa100: null })

const terms = [term('2024-1', 1), term('2024-2', 2)]
const courses = [c('a', '전공필수', '2024-1', 3, 'A+'), { ...c('b', '전공필수', '2023-1'), supersededBy: 'a' }, c('u', '교양', null)]
const rows = gridRows(DEFAULT_CREDIT_CATS, courses)
const active = activeCourses(courses)
const noop = () => {}

function grid(over: Partial<Parameters<typeof CreditGrid>[0]> = {}) {
  return render(<CreditGrid rows={rows} terms={terms} active={active} firstYear={2024} onPickCourse={noop} onAddCourse={noop} onEditRow={noop} onAddRow={noop} {...over} />)
}

test('renders term headers with grade-year labels and an unassigned column', () => {
  grid()
  expect(screen.getByText('1학년 1학기')).toBeInTheDocument()
  expect(screen.getByText('1학년 2학기')).toBeInTheDocument()
  expect(screen.getByText('미배정')).toBeInTheDocument()
})

test('course chip shows name + grade and opens on click; superseded chip is struck through', () => {
  const onPick = vi.fn()
  grid({ onPickCourse: onPick })
  fireEvent.click(screen.getByRole('button', { name: 'a A+' }))
  expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
  expect(screen.getByRole('button', { name: 'b A' })).toHaveClass('line-through')
})

test('+ chip adds into that term and row; unassigned course sits in the last column', () => {
  const onAdd = vi.fn()
  grid({ onAddCourse: onAdd })
  fireEvent.click(screen.getByRole('button', { name: '과목 추가 · 전공선택 · 1학년 2학기' }))
  expect(onAdd).toHaveBeenCalledWith('2024-2', '전공선택')
  expect(screen.getByRole('button', { name: 'u A' })).toBeInTheDocument()
})

test('footer shows term GPA or N/A', () => {
  grid()
  expect(screen.getByText('4.50')).toBeInTheDocument()
  expect(screen.getByText('N/A')).toBeInTheDocument()
})

test('row cell click edits the row; the bottom-left button adds one', () => {
  const onEditRow = vi.fn()
  const onAddRow = vi.fn()
  grid({ onEditRow, onAddRow })
  fireEvent.click(screen.getByRole('button', { name: /^전공필수/ }))
  expect(onEditRow).toHaveBeenCalledWith(expect.objectContaining({ id: 'seed-major-req' }))
  fireEvent.click(screen.getByRole('button', { name: '이수구분 추가' }))
  expect(onAddRow).toHaveBeenCalled()
})
