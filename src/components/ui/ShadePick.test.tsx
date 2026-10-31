import { fireEvent, render, screen } from '@testing-library/react'
import { ShadePick } from './ShadePick'

test('renders six shade radios with the current one checked', () => {
  render(<ShadePick value={3} onChange={() => {}} label="색" />)
  const radios = screen.getAllByRole('radio')
  expect(radios).toHaveLength(6)
  expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'true')
})

test('clicking a shade reports its number', () => {
  const onChange = vi.fn()
  render(<ShadePick value={1} onChange={onChange} label="색" />)
  fireEvent.click(screen.getByRole('radio', { name: '4' }))
  expect(onChange).toHaveBeenCalledWith(4)
})
