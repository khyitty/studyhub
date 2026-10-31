import type { ReactElement } from 'react'
import type { Cover as CoverKind } from '../../lib/theme'

type Props = { kind: CoverKind; compact?: boolean }

/** Leaf tile: two mirrored leaves per 48px cell, filled with the second and third shades. */
function Leaf() {
  return (
    <svg width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="cover-leaf" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M8 36c0-12 8-20 20-22-2 12-10 20-20 22z" fill="var(--color-s2)" />
          <path d="M26 14c6 2 10 8 10 16-6-2-10-8-10-16z" fill="var(--color-s3)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cover-leaf)" />
    </svg>
  )
}

function Wave() {
  return (
    <svg width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="cover-wave" width="64" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 12c8-8 16-8 24 0s16 8 24 0 16-8 24 0" fill="none" stroke="var(--color-s2)" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cover-wave)" />
    </svg>
  )
}

function Grid() {
  return (
    <svg width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="cover-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0v24" fill="none" stroke="var(--color-s2)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cover-grid)" />
    </svg>
  )
}

const PATTERN: Record<Exclude<CoverKind, 'none' | 'solid'>, () => ReactElement> = { leaf: Leaf, wave: Wave, grid: Grid }

/** Thin themed band at the top of the home page. `compact` is the settings preview (no page bleed). */
export function Cover({ kind, compact = false }: Props) {
  if (kind === 'none') return null
  const Pattern = kind === 'solid' ? null : PATTERN[kind]
  const size = compact ? 'h-8 w-full' : '-mx-4 h-[72px] md:-mx-8 md:h-[96px]'
  return (
    <div data-cover={kind} aria-hidden="true" className={`relative overflow-hidden bg-cover-bg ${size}`}>
      {Pattern && <Pattern />}
    </div>
  )
}
