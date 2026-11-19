import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'review-shots')
const baseUrl = 'http://127.0.0.1:5174'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()

async function ready(page, path) {
  await page.goto(`${baseUrl}/#${path}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(120)
}

async function scrollToBeat(page, index) {
  const body = page.locator('.window-xborg > .window-body')
  const target = await page.locator('.beat').nth(index).evaluate((beat) => {
    const scrollBody = beat.closest('.window-body')
    if (!(scrollBody instanceof HTMLElement)) throw new Error('Missing conversation body')
    const aligned =
      beat.getBoundingClientRect().top - scrollBody.getBoundingClientRect().top + scrollBody.scrollTop - 16
    return Math.min(aligned, scrollBody.scrollHeight - scrollBody.clientHeight)
  })
  let current = 0
  while (current < target) {
    current = await body.evaluate((node) => {
      node.scrollTop += 120
      return node.scrollTop
    })
    await page.waitForTimeout(90)
  }
  await body.evaluate((node, scrollTop) => {
    node.scrollTop = scrollTop
  }, target)
  await page.waitForTimeout(650)
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport })
  const prefix = join(outDir, `m5-${viewport.width}`)

  await ready(page, 'workspace')
  await page.screenshot({ path: `${prefix}-workspace.png` })

  await page.locator('[data-dock="propr"]').click()
  await page.mouse.move(12, 96)
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${prefix}-propr.png` })

  for (const portalState of [
    { route: 'portal-entry', name: 'portal-entry' },
    { route: 'portal-unstaked', name: 'portal-staking' },
    { route: 'portal-home', name: 'portal' },
    { route: 'portal-participate', name: 'portal-missions' },
    { route: 'portal-rewards', name: 'portal-rewards' },
  ]) {
    await ready(page, portalState.route)
    await page.waitForTimeout(350)
    await page.screenshot({ path: `${prefix}-${portalState.name}.png` })
  }

  await ready(page, 'workspace')
  await scrollToBeat(page, 2)
  await page.screenshot({ path: `${prefix}-beat-3.png` })

  await ready(page, 'workspace')
  await scrollToBeat(page, 4)
  await page.screenshot({ path: `${prefix}-beat-5.png` })

  await page.close()
}

const videoContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: '/tmp/xborg-milestone-5-video', size: { width: 1440, height: 900 } },
})
const videoPage = await videoContext.newPage()
await ready(videoPage, 'workspace')
await videoPage.waitForTimeout(700)
await videoPage.mouse.move(80, 180)
for (let index = 0; index < 24; index += 1) {
  await videoPage.mouse.wheel(0, 120)
  await videoPage.waitForTimeout(260)
}
await videoPage.waitForTimeout(500)
const video = videoPage.video()
await videoContext.close()
if (!video) throw new Error('Recording was not created')
copyFileSync(await video.path(), join(outDir, 'm5-load-slow-scroll.webm'))

await browser.close()
console.log('Milestone 5 review artefacts captured')
