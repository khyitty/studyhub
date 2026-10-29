import { useEffect, useRef } from 'react'

const COLORS = ['#f6a48b', '#8a6bd6', '#3f9a6e', '#ffd666', '#e8835a', '#cdeedd']
const COUNT = 40
const DURATION = 1200

/** Fires a short canvas particle burst every time `fire` changes to a new truthy value. */
export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!fire) return
    const canvas = ref.current
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = (canvas.width = window.innerWidth * dpr)
    const h = (canvas.height = window.innerHeight * dpr)
    const parts = Array.from({ length: COUNT }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 14 * dpr,
      vy: (-8 - Math.random() * 10) * dpr,
      r: (4 + Math.random() * 4) * dpr,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    }))
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = (now - start) / DURATION
      ctx.clearRect(0, 0, w, h)
      if (p >= 1) return
      ctx.globalAlpha = 1 - p * p
      for (const q of parts) {
        q.vy += 0.45 * dpr
        q.x += q.vx
        q.y += q.vy
        q.rot += q.vr
        ctx.save()
        ctx.translate(q.x, q.y)
        ctx.rotate(q.rot)
        ctx.fillStyle = q.c
        ctx.fillRect(-q.r, -q.r / 2, q.r * 2, q.r)
        ctx.restore()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h) }
  }, [fire])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-dvh w-screen" />
}
