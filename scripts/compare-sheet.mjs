// Builds side by side before and after images for review.
// Usage: node scripts/compare-sheet.mjs <before set> <after set>
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const [beforeSet = 'before', afterSet = 'after-m8'] = process.argv.slice(2)
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'review-shots', 'r5')
const outDir = join(root, `compare-${afterSet}`)
mkdirSync(outDir, { recursive: true })
const names = readdirSync(join(root, afterSet)).filter((f) => f.endsWith('.png') && existsSync(join(root, beforeSet, f)))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
for (const name of names) {
  // Inline the images: a page set from a string cannot read local files.
  const src = (set) => `data:image/png;base64,${readFileSync(join(root, set, name)).toString('base64')}`
  await page.setContent(`<!doctype html><body style="margin:0;background:#050507;font:14px system-ui;color:#a3a3ad">
    <div style="display:flex;gap:16px;padding:16px;align-items:flex-start">
      <figure style="margin:0;flex:1"><figcaption style="margin-bottom:8px">Before</figcaption><img src="${src(beforeSet)}" style="width:100%"></figure>
      <figure style="margin:0;flex:1"><figcaption style="margin-bottom:8px">After</figcaption><img src="${src(afterSet)}" style="width:100%"></figure>
    </div></body>`)
  await page.waitForLoadState('load')
  await page.screenshot({ path: join(outDir, name), fullPage: true })
}
await browser.close()
console.log(`${names.length} comparisons saved to ${outDir}`)
