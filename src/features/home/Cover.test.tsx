import { render } from '@testing-library/react'
import { Cover } from './Cover'

test('none renders nothing', () => {
  expect(render(<Cover kind="none" />).container).toBeEmptyDOMElement()
})

test.each(['leaf', 'wave', 'grid'] as const)('%s renders an svg pattern tagged with data-cover', (k) => {
  const { container } = render(<Cover kind={k} />)
  expect(container.querySelector(`[data-cover="${k}"] svg`)).not.toBeNull()
})

test('solid renders the band without an svg', () => {
  const { container } = render(<Cover kind="solid" />)
  expect(container.querySelector('[data-cover="solid"]')).not.toBeNull()
  expect(container.querySelector('svg')).toBeNull()
})

test('compact variant drops the page-bleed margins', () => {
  const { container } = render(<Cover kind="leaf" compact />)
  const el = container.querySelector('[data-cover="leaf"]')!
  expect(el.className).toContain('h-8')
  expect(el.className).not.toContain('-mx-4')
})
