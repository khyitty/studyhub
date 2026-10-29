export const XP_TODO = 10

/** level = floor(sqrt(xp / 50)) + 1 */
export function levelFor(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1
}

/** xp needed to reach `level`: 50 * (level - 1)^2 */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2
}

export function levelProgress(xp: number): { level: number; current: number; needed: number; ratio: number } {
  const level = levelFor(xp)
  const base = xpForLevel(level)
  const needed = xpForLevel(level + 1) - base
  const current = xp - base
  return { level, current, needed, ratio: current / needed }
}

export function applyXp(xp: number, delta: number): number {
  return Math.max(0, xp + delta)
}
