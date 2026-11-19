import { expect, test } from '@playwright/test'

const landing = ['workspace', 'propr', 'fanbase', 'trigr'] as const

for (const id of landing) {
  test(`desktop ${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/#${id}`)
    await page.waitForTimeout(900)
    await page.screenshot({
      path: `review-shots/m2-1440-${id}.png`,
      fullPage: false,
    })
  })

  test(`mobile ${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/#${id}`)
    await page.waitForTimeout(900)
    await page.screenshot({
      path: `review-shots/m2-390-${id}.png`,
      fullPage: false,
    })
  })
}

test('beat 2 tiles fill the grid cells', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#workspace')
  await page.waitForTimeout(900)
  const fill = await page.evaluate(() => {
    const panel = document.querySelector('.product-panel') as HTMLElement
    const tiles = [...panel.querySelectorAll('.product-tile')] as HTMLElement[]
    const cell = panel.getBoundingClientRect().width / 3
    return tiles.map((tile) => tile.getBoundingClientRect().width / cell)
  })
  expect(fill).toHaveLength(3)
  for (const ratio of fill) expect(ratio).toBeGreaterThan(0.9)
})

test('mobile launcher is five tiles and fits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#workspace')
  const metrics = await page.evaluate(() => {
    const dock = document.querySelector('.dock') as HTMLElement
    const tiles = [...dock.querySelectorAll('[data-dock]')]
    const social = [...dock.querySelectorAll('.dock-social')].filter(
      (node) => getComputedStyle(node).display !== 'none',
    )
    const r = dock.getBoundingClientRect()
    return { tiles: tiles.length, social: social.length, left: r.left, right: r.right, width: r.width }
  })
  expect(metrics.tiles).toBe(5)
  expect(metrics.social).toBe(0)
  expect(metrics.left).toBeGreaterThanOrEqual(-1)
  expect(metrics.right).toBeLessThanOrEqual(391)
})

test('mobile product sheet covers the viewport and keeps close', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#propr')
  await page.waitForTimeout(400)
  const sheet = await page.evaluate(() => {
    const win = document.querySelector('.window-product') as HTMLElement
    const close = win.querySelector('.window-close') as HTMLElement
    const r = win.getBoundingClientRect()
    return {
      position: getComputedStyle(win).position,
      top: r.top,
      height: r.height,
      z: Number(getComputedStyle(win).zIndex),
      dockZ: Number(getComputedStyle(document.querySelector('.dock') as HTMLElement).zIndex),
      closeDisplay: getComputedStyle(close).display,
    }
  })
  expect(sheet.position).toBe('fixed')
  expect(sheet.top).toBeGreaterThanOrEqual(-1)
  expect(sheet.top).toBeLessThan(8)
  expect(sheet.height).toBeGreaterThan(800)
  expect(sheet.z).toBeGreaterThan(sheet.dockZ)
  expect(sheet.closeDisplay).not.toBe('none')
})

test('check 3 holds from real content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#workspace')
  const metrics = await page.evaluate(() => {
    const body = document.querySelector('.window-body') as HTMLElement
    const conversation = document.querySelector('.conversation') as HTMLElement
    const style = getComputedStyle(conversation)
    return {
      bodyScroll: body.scrollHeight,
      bodyClient: body.clientHeight,
      minHeight: style.minHeight,
      paddingBottom: parseFloat(style.paddingBottom),
      inner: window.innerHeight,
    }
  })
  expect(metrics.minHeight === '0px' || metrics.minHeight === 'auto').toBe(true)
  expect(metrics.paddingBottom).toBeLessThanOrEqual(metrics.inner * 0.2 + 1)
  expect(metrics.bodyScroll).toBeGreaterThanOrEqual(metrics.bodyClient * 2)
})
