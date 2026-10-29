import { render } from '@testing-library/react'
import { Gauge } from './Gauge'

describe('Gauge', () => {
  test('value 0 has no data-complete attribute', () => {
    const { getByRole } = render(<Gauge value={0} />)
    expect(getByRole('progressbar')).not.toHaveAttribute('data-complete')
  })
  test('value 1 marks data-complete true', () => {
    const { getByRole } = render(<Gauge value={1} />)
    expect(getByRole('progressbar')).toHaveAttribute('data-complete', 'true')
  })
  test('value above 1 is clamped to 100% width', () => {
    const { getByTestId } = render(<Gauge value={1.4} />)
    expect(getByTestId('gauge-fill')).toHaveStyle({ width: '100%' })
  })
})
