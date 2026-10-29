import { fireEvent, render, screen } from '@testing-library/react'
import { SchoolTable } from './SchoolTable'
import { normalizeSchool } from '../../lib/schools'

const s = normalizeSchool({ name: 'Stanford', program: 'Statistics PhD', deadline: '2026-12-01' }, 'a')

test('school row can be expanded from the keyboard via a button in the first cell', () => {
  const onToggle = vi.fn()
  render(<SchoolTable schools={[s]} today="2026-10-29" mine={null} sortKey="deadline" onSort={() => {}} expandedId={null} onToggle={onToggle} onEdit={() => {}} onDelete={() => {}} />)
  const btn = screen.getByRole('button', { name: /Stanford/ })
  expect(btn).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(btn)
  expect(onToggle).toHaveBeenCalledWith('a')
})
