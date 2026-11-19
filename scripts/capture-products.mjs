import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public/captures')
mkdirSync(outDir, { recursive: true })

const shots = [
  { id: 'propr', url: 'https://propr.xyz', file: 'propr.jpg' },
  { id: 'fanbase', url: 'https://fanbase.gg', file: 'fanbase.jpg' },
  { id: 'trigr', url: 'https://beta.trigr.xyz', file: 'trigr.jpg' },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

for (const shot of shots) {
  try {
    await page.goto(shot.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2500)
    for (const label of ['Accept', 'Accept all', 'I agree', 'Got it', 'Close']) {
      const btn = page.getByRole('button', { name: label }).first()
      if (await btn.count()) {
        await btn.click({ timeout: 1500 }).catch(() => {})
      }
    }
    await page.screenshot({
      path: join(outDir, shot.file),
      type: 'jpeg',
      quality: 82,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    })
    console.log('captured', shot.id)
  } catch (error) {
    console.error('failed', shot.id, error.message)
  }
}

await browser.close()
