// Interactive states and the walkthrough recording.
// Usage: node scripts/capture-m7.mjs [set]   (default m7)
import { mkdirSync, renameSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [set = 'm7'] = process.argv.slice(2)
const outDir = join(root, 'review-shots', 'r5', set)
const baseUrl = 'http://127.0.0.1:5174'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()

async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
}

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 24 })
  await page.mouse.up()
}

const box = (page, selector) => page.locator(selector).boundingBox()

// States at 1440 by 900.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const shot = (name) => page.screenshot({ path: join(outDir, `1440-${name}.png`) })

  await page.goto(`${baseUrl}/#portal-home`)
  await settle(page)
  await page.getByRole('button', { name: 'Close' }).click()
  await page.waitForTimeout(400)
  await page.locator('.topbar .wallet-control').click()
  await page.waitForTimeout(300)
  await shot('wallet-menu')
  await page.keyboard.press('Escape')

  await page.goto(`${baseUrl}/#portal-entry`)
  await settle(page)
  await page.locator('.portal-entry-content .btn-primary').click()
  await page.waitForTimeout(250)
  await shot('wallet-connecting')
  await page.waitForTimeout(900)
  await shot('wallet-connected-portal')

  await page.goto(`${baseUrl}/#propr`)
  await settle(page)
  let win = await box(page, '.window-product')
  await drag(page, { x: win.x + win.width - 2, y: win.y + win.height - 2 }, { x: win.x + 200, y: win.y + 200 })
  win = await box(page, '.window-product')
  await drag(page, { x: win.x + 80, y: win.y + 20 }, { x: 260, y: 140 })
  await page.mouse.move(8, 200)
  await page.waitForTimeout(200)
  await shot('product-minimum-moved')

  await page.goto(`${baseUrl}/#portal-home`)
  await page.reload()
  await settle(page)
  win = await box(page, '.window-portal')
  await drag(page, { x: win.x + win.width - 2, y: win.y + win.height - 2 }, { x: win.x + 100, y: win.y + 100 })
  await page.mouse.move(8, 200)
  await page.waitForTimeout(200)
  await shot('portal-minimum')
  await page.getByRole('button', { name: 'Maximise' }).click()
  await page.mouse.move(8, 200)
  await page.waitForTimeout(300)
  await shot('portal-maximised')

  await page.goto(`${baseUrl}/#workspace`)
  await page.reload()
  await settle(page)
  await page.locator('[data-dock="fanbase"]').hover()
  await page.waitForTimeout(300)
  await shot('dock-hover')
  await page.mouse.move(8, 200)
  await page.keyboard.press('Tab')
  await page.locator('[data-dock="trigr"]').focus()
  await page.waitForTimeout(300)
  await shot('dock-keyboard-focus')

  await page.goto(`${baseUrl}/?present=1#workspace`)
  await settle(page)
  await shot('present-mode')
  await page.close()
}

// Walkthrough recording: load, slow scroll, open, resize, move, close.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: outDir, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()
  await page.goto(`${baseUrl}/?present=1#workspace`)
  await settle(page)
  await page.waitForTimeout(1200)
  await page.mouse.move(720, 450)
  for (let i = 0; i < 60; i += 1) {
    await page.mouse.wheel(0, 60)
    await page.waitForTimeout(90)
  }
  await page.waitForTimeout(1200)
  await page.locator('[data-dock="propr"]').click()
  await page.waitForTimeout(900)
  let win = await box(page, '.window-product')
  await drag(page, { x: win.x + win.width - 2, y: win.y + win.height - 2 }, { x: win.x + win.width + 160, y: win.y + win.height + 60 })
  await page.waitForTimeout(500)
  win = await box(page, '.window-product')
  await drag(page, { x: win.x + 120, y: win.y + 20 }, { x: win.x + 20, y: win.y - 30 })
  await page.waitForTimeout(500)
  await page.locator('.window-product .window-title').dblclick({ position: { x: 300, y: 20 } })
  await page.waitForTimeout(900)
  await page.locator('.window-product .window-title').dblclick({ position: { x: 300, y: 20 } })
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: 'Close' }).click()
  await page.waitForTimeout(1200)
  const video = page.video()
  await context.close()
  if (video) renameSync(await video.path(), join(outDir, `${set}-walkthrough.webm`))
}

await browser.close()
console.log(`Saved to ${outDir}`)
