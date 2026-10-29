// Generates PNG app icons from public/icons/icon.svg. Run: npm run icons
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'public', 'icons')
const svg = await readFile(path.join(dir, 'icon.svg'))

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(dir, file))
  console.log('wrote', file)
}

// maskable: same artwork with safe-zone padding on a solid background
await sharp(svg, { density: 384 })
  .resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#ffd6c2' })
  .png()
  .toFile(path.join(dir, 'icon-maskable-512.png'))
console.log('wrote icon-maskable-512.png')
