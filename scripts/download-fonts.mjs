import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const outDir = join(root, 'public/fonts')
mkdirSync(outDir, { recursive: true })

const packs = [
  { pkg: '@fontsource-variable/archivo', dest: 'archivo-wdth-wght.woff2', match: /archivo-latin-standard-normal\.woff2$/ },
  { pkg: '@fontsource/geist-sans', dest: 'geist-sans-400.woff2', match: /latin-400-normal\.woff2$/ },
  { pkg: '@fontsource/geist-sans', dest: 'geist-sans-500.woff2', match: /latin-500-normal\.woff2$/ },
  { pkg: '@fontsource/geist-sans', dest: 'geist-sans-600.woff2', match: /latin-600-normal\.woff2$/ },
  { pkg: '@fontsource/geist-sans', dest: 'geist-sans-700.woff2', match: /latin-700-normal\.woff2$/ },
  { pkg: '@fontsource/geist-mono', dest: 'geist-mono-400.woff2', match: /latin-400-normal\.woff2$/ },
  { pkg: '@fontsource/geist-mono', dest: 'geist-mono-500.woff2', match: /latin-500-normal\.woff2$/ },
]

function listFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) listFiles(path, acc)
    else acc.push(path)
  }
  return acc
}

function findWoff2(dir, match) {
  const files = listFiles(dir).filter((path) => path.endsWith('.woff2'))
  const found = files.find((path) => match.test(path))
  if (!found) {
    console.error('Available woff2:')
    for (const file of files) console.error(' ', file)
    throw new Error(`No woff2 matching ${match} in ${dir}`)
  }
  return found
}

const seen = new Map()
for (const pack of packs) {
  let dir = seen.get(pack.pkg)
  if (!dir) {
    const tmp = mkdtempSync(join(tmpdir(), 'xborg-font-'))
    execFileSync('npm', ['pack', pack.pkg, '--pack-destination', tmp], { stdio: 'inherit' })
    const tgz = readdirSync(tmp).find((f) => f.endsWith('.tgz'))
    execFileSync('tar', ['-xzf', join(tmp, tgz), '-C', tmp])
    dir = join(tmp, 'package')
    seen.set(pack.pkg, dir)
  }
  const src = findWoff2(dir, pack.match)
  copyFileSync(src, join(outDir, pack.dest))
  console.log(pack.dest, '←', src)
}
