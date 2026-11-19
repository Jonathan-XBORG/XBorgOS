// Round 5 evidence capture, extended for the taste QA round.
// Usage: node scripts/capture-round5.mjs <set> [direction] [scope] [--root dir] [--widths list] [--present]
//   set:       folder name under review-shots/<root>, for example before, direction-a
//   direction: leave empty. It was the Milestone 6 direction switch
//   scope:     all (every screen) or trio (the three comparison screens)
//   --root:    folder under review-shots, r5 by default. Taste QA uses taste-qa
//   --widths:  comma separated viewport widths, 1440,390 by default. Taste QA uses 1440,1024,390
//   --present: also capture every screen with ?present=1, which hides the review bar
//   --scroll:  also capture each further screen of the main scroll area (Portal body, product
//              window, documentation page), as <width>-<id>-scroll-<n>.png
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const argv = process.argv.slice(2)
const option = (name, fallback) => {
  const index = argv.indexOf(`--${name}`)
  if (index === -1) return fallback
  const [, value] = argv.splice(index, 2)
  return value
}
const flag = (name) => {
  const index = argv.indexOf(`--${name}`)
  if (index === -1) return false
  argv.splice(index, 1)
  return true
}
const shotRoot = option('root', 'r5')
const widths = option('widths', '1440,390').split(',').map(Number)
const withPresent = flag('present')
const withScroll = flag('scroll')
const only = option('only', '')
const [set = 'before', direction = '', scope = 'all'] = argv
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'review-shots', shotRoot, set)
const baseUrl = 'http://127.0.0.1:5174'
const query = direction ? `?direction=${direction}` : ''
const HEIGHTS = { 1440: 900, 1280: 800, 1024: 768, 390: 844, 320: 640 }
mkdirSync(outDir, { recursive: true })

// The review states come from src/screens.ts, so new states are captured too.
function screenIds() {
  const source = readFileSync(join(root, 'src', 'screens.ts'), 'utf8')
  return [...source.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map((match) => match[1])
}

const SCREENS = screenIds()

const browser = await chromium.launch()

async function ready(page, id, search = query) {
  await page.goto(`${baseUrl}/${search}#${id}`)
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(4, 120)
  await page.waitForTimeout(700)
}

// Pages down the main scroll area of a state, saving one shot per screen.
async function scrollShots(page, shot, id) {
  const pages = await page.evaluate(() => {
    const candidates = ['.portal-modal-body', '.portal-body', '.window-product .window-body', '.system', 'html']
    for (const selector of candidates) {
      const el = selector === 'html' ? document.scrollingElement : document.querySelector(selector)
      if (el && el.scrollHeight > el.clientHeight + 24) {
        el.setAttribute('data-capture-scroll', '')
        return Math.min(8, Math.ceil((el.scrollHeight - el.clientHeight) / (el.clientHeight * 0.85)))
      }
    }
    return 0
  })
  for (let n = 1; n <= pages; n++) {
    await page.evaluate((step) => {
      const el = document.querySelector('[data-capture-scroll]')
      el.scrollTop = Math.round(el.clientHeight * 0.85 * step)
    }, n)
    await page.waitForTimeout(250)
    await shot(`${id}-scroll-${n}`)
  }
  await page.evaluate(() => {
    const el = document.querySelector('[data-capture-scroll]')
    if (!el) return
    el.scrollTop = 0
    el.removeAttribute('data-capture-scroll')
  })
}

async function scrollToBeat(page, index) {
  const body = page.locator('.window-xborg .window-body')
  const target = await page.locator('.beat').nth(index).evaluate((beat) => {
    const scrollBody = beat.closest('.window-body')
    if (!(scrollBody instanceof HTMLElement)) throw new Error('Missing conversation body')
    const aligned =
      beat.getBoundingClientRect().top - scrollBody.getBoundingClientRect().top + scrollBody.scrollTop - 16
    return Math.min(aligned, scrollBody.scrollHeight - scrollBody.clientHeight)
  })
  let current = await body.evaluate((node) => node.scrollTop)
  while (current < target) {
    current = await body.evaluate((node) => {
      node.scrollTop += 140
      return node.scrollTop
    })
    await page.waitForTimeout(80)
  }
  await body.evaluate((node, scrollTop) => {
    node.scrollTop = scrollTop
  }, target)
  await page.waitForTimeout(900)
}

for (const viewport of widths.map((width) => ({ width, height: HEIGHTS[width] ?? Math.round(width * 0.625) }))) {
  const page = await browser.newPage({ viewport })
  const shot = (name) => page.screenshot({ path: join(outDir, `${viewport.width}-${name}.png`) })
  const list = (
    scope === 'trio'
      ? ['workspace', 'portal-home', 'propr', 'system']
      : SCREENS.filter((id) => shotRoot !== 'r5' || set !== 'before' || id !== 'system')
  ).filter((id) => !only || only.split(',').includes(id))

  for (const id of list) {
    await ready(page, id)
    await shot(id)
    if (withScroll && id !== 'workspace') await scrollShots(page, shot, id)
    if (withPresent) {
      await ready(page, id, '?present=1')
      await shot(`present-${id}`)
    }
  }

  for (const beat of only && !only.split(',').includes('workspace') ? [] : scope === 'trio' ? [1, 4] : [1, 2, 4]) {
    await ready(page, 'workspace')
    await scrollToBeat(page, beat)
    await shot(`workspace-beat-${beat + 1}`)
  }

  await page.close()
}

await browser.close()
console.log(`Saved to ${outDir}`)
