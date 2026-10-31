import { fireEvent, render, screen } from '@testing-library/react'
import { HuePicker } from './HuePicker'

test('six hue radios, the current one checked, each with a six-step ramp', () => {
  render(<HuePicker value="rose" onChange={() => {}} label="테마 색" />)
  const radios = screen.getAllByRole('radio')
  expect(radios).toHaveLength(6)
  expect(screen.getByRole('radio', { name: '로즈' })).toHaveAttribute('aria-checked', 'true')
  expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  expect(radios[0].querySelectorAll('[data-shade]')).toHaveLength(6)
})

test('clicking a hue reports its id', () => {
  const onChange = vi.fn()
  render(<HuePicker value="green" onChange={onChange} label="테마 색" />)
  fireEvent.click(screen.getByRole('radio', { name: '파랑' }))
  expect(onChange).toHaveBeenCalledWith('blue')
})
