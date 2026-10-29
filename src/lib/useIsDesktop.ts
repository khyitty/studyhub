import { useEffect, useState } from 'react'

const QUERY = '(min-width: 768px)'

/** true at Tailwind's `md` breakpoint and above; updates on resize. */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : true))
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return desktop
}
