import { expect, test, type Page } from '@playwright/test'

async function metrics(page: Page) {
  return page.evaluate(() => {
    const body = document.querySelector('.window-body') as HTMLElement | null
    const win = document.querySelector('.window-xborg') as HTMLElement | null
    const top = document.querySelector('.topbar') as HTMLElement | null
    const dock = document.querySelector('.dock') as HTMLElement | null
    const pageEl = document.scrollingElement
    if (!body || !win || !top || !dock || !pageEl) {
      throw new Error('Missing layout nodes')
    }
    const wr = win.getBoundingClientRect()
    const tr = top.getBoundingClientRect()
    const dr = dock.getBoundingClientRect()
    return {
      pageScroll: pageEl.scrollHeight,
      inner: window.innerHeight,
      innerWidth: window.innerWidth,
      bodyScroll: body.scrollHeight,
      bodyClient: body.clientHeight,
      winWidth: wr.width,
      winTop: wr.top,
      winBottom: wr.bottom,
      topBottom: tr.bottom,
      dockTop: dr.top,
      overflow: getComputedStyle(document.body).overflow,
    }
  })
}

test('page does not scroll and conversation does', async ({ page }) => {
  await page.goto('/#workspace')
  const before = await metrics(page)
  expect(before.overflow).toMatch(/hidden/)
  expect(before.pageScroll).toBe(before.inner)
  expect(before.bodyScroll).toBeGreaterThanOrEqual(before.bodyClient * 2)

  await page.mouse.move(40, 200)
  await page.mouse.wheel(0, 400)
  const scrolled = await page.evaluate(() => {
    const body = document.querySelector('.window-body') as HTMLElement
    return body.scrollTop
  })
  expect(scrolled).toBeGreaterThan(0)

  const after = await metrics(page)
  expect(after.pageScroll).toBe(after.inner)
})

test('window stays clear of top bar and dock', async ({ page }) => {
  await page.goto('/#workspace')
  const m = await metrics(page)
  expect(m.winTop - m.topBottom).toBeGreaterThanOrEqual(24)
  expect(m.dockTop - m.winBottom).toBeGreaterThanOrEqual(24)
  expect(m.winWidth).toBeLessThanOrEqual(720 + 1)
})

test('window shrinks at 1000px wide and stays clear', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 })
  await page.goto('/#workspace')
  const m = await metrics(page)
  expect(m.winWidth).toBeLessThanOrEqual(1000 * 0.88 + 1)
  expect(m.winWidth).toBeLessThanOrEqual(1000 * 0.92 + 1)
  expect(m.winTop - m.topBottom).toBeGreaterThanOrEqual(24)
  expect(m.dockTop - m.winBottom).toBeGreaterThanOrEqual(24)
})

test('desktop screenshot', async ({ page }) => {
  await page.goto('/#workspace')
  await page.screenshot({
    path: 'review-shots/m2-1440-workspace.png',
    fullPage: false,
  })
})

test('tab order is Ask field, wallet button, window body, dock tiles', async ({ page }) => {
  await page.goto('/#workspace')
  const focusedOnLoad = await page.evaluate(() =>
    document.activeElement?.classList.contains('window-body'),
  )
  expect(focusedOnLoad).toBe(true)

  const order = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>(
      'a[href], button:not([tabindex="-1"]), select, textarea, input, [tabindex]:not([tabindex="-1"])',
    )]
    return nodes
      .filter((node) => !node.closest('[hidden]') && node.getClientRects().length > 0)
      .map((node) => node.getAttribute('data-focus') || node.getAttribute('data-dock') || node.className)
  })
  expect(order[0]).toBe('ask-trigger')
  expect(order[1]).toBe('connect-wallet')
  expect(order[2]).toContain('window-body')
  expect(order).toContain('propr')

  await page.locator('[data-focus="connect-wallet"]').focus()
  await page.keyboard.press('Tab')
  const second = await page.evaluate(() => document.activeElement?.classList.contains('window-body'))
  expect(second).toBe(true)
  await page.keyboard.press('Tab')
  const third = await page.evaluate(() => document.activeElement?.getAttribute('data-product-link'))
  expect(third).toBe('propr')
})
