import { render, screen } from '@testing-library/react'
import { Tag } from './Tag'

test('Tag renders text with tone class', () => {
  render(<Tag tone="bad">필수</Tag>)
  const el = screen.getByText('필수')
  expect(el.className).toMatch(/text-danger/)
  expect(el.className).toMatch(/rounded-pill/)
})
test('Tag none tone is muted', () => {
  render(<Tag tone="none">—</Tag>)
  expect(screen.getByText('—').className).toMatch(/text-ink-muted/)
})
