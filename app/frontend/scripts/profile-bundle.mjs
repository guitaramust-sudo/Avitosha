import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const assetsDirectory = path.resolve('dist/assets')
const names = await readdir(assetsDirectory)
const assets = await Promise.all(
  names.map(async (name) => {
    const filePath = path.join(assetsDirectory, name)
    return { name, bytes: (await stat(filePath)).size }
  }),
)

const groups = new Map([
  [
    'images',
    new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']),
  ],
  ['fonts', new Set(['.otf', '.ttf', '.woff', '.woff2'])],
  ['javascript', new Set(['.js', '.mjs'])],
  ['styles', new Set(['.css'])],
])

const totals = Object.fromEntries([...groups.keys()].map((group) => [group, 0]))
totals.other = 0

for (const asset of assets) {
  const extension = path.extname(asset.name).toLowerCase()
  const group = [...groups].find(([, extensions]) =>
    extensions.has(extension),
  )?.[0]
  totals[group ?? 'other'] += asset.bytes
}

const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`
const totalBytes = assets.reduce((total, asset) => total + asset.bytes, 0)

console.log(
  `Bundle assets: ${formatSize(totalBytes)} across ${assets.length} files`,
)
for (const [group, bytes] of Object.entries(totals)) {
  console.log(`${group.padEnd(10)} ${formatSize(bytes)}`)
}

console.log('\nLargest assets:')
for (const asset of assets
  .toSorted((left, right) => right.bytes - left.bytes)
  .slice(0, 10)) {
  console.log(`${formatSize(asset.bytes).padStart(12)}  ${asset.name}`)
}
