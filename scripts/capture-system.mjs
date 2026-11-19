// Captures the #system sheet section by section for one direction.
// Usage: node scripts/capture-system.mjs <direction> <set>
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const [direction = 'a', set = `direction-${direction}`] = process.argv.slice(2)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'review-shots', 'r5', set)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(`http://127.0.0.1:5174/?direction=${direction}#system`)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
const height = await page.locator('.system').evaluate((node) => node.scrollHeight)
for (let top = 0, i = 1; top < height; top += 820, i += 1) {
  await page.locator('.system').evaluate((node, y) => (node.scrollTop = y), top)
  await page.waitForTimeout(150)
  await page.screenshot({ path: join(outDir, `1440-system-${String(i).padStart(2, '0')}.png`) })
}
await browser.close()
console.log(`Saved to ${outDir}`)
