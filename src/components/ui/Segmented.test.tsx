import { fireEvent, render, screen } from '@testing-library/react'
import { Segmented } from './Segmented'

test('Segmented marks selected option and calls onChange', () => {
  const onChange = vi.fn()
  render(<Segmented label="view" value="table" onChange={onChange} options={[{ value: 'table', label: '표' }, { value: 'cards', label: '카드' }]} />)
  expect(screen.getByRole('radio', { name: '표' })).toHaveAttribute('aria-checked', 'true')
  fireEvent.click(screen.getByRole('radio', { name: '카드' }))
  expect(onChange).toHaveBeenCalledWith('cards')
})
