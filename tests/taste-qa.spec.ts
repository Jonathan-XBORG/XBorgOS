import { expect, test } from '@playwright/test'

// Regression checks for the defects fixed in taste QA Milestone Q1.

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
]) {
  test(`Portal opens clear of the menu bar and dock at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#stake-active')
    const portal = page.locator('.window-portal')
    await expect.poll(() => portal.evaluate((node) => getComputedStyle(node).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/)
    const gaps = await page.evaluate(() => {
      const win = document.querySelector('.window-portal')!.getBoundingClientRect()
      const bar = document.querySelector('.topbar')!.getBoundingClientRect()
      const dock = document.querySelector('.dock')!.getBoundingClientRect()
      return { top: win.top - bar.bottom, bottom: dock.top - win.bottom }
    })
    expect(gaps.top).toBeGreaterThanOrEqual(24)
    expect(gaps.bottom).toBeGreaterThanOrEqual(24)
  })
}

test('keyboard focus on mobile never lands under the Portal tab bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#stake-not-verified')
  await expect(page.locator('.portal-tabbar')).toBeVisible()
  const tabbarTop = await page.locator('.portal-tabbar').evaluate((node) => node.getBoundingClientRect().top)
  for (let i = 0; i < 16; i += 1) {
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const rect = el.getBoundingClientRect()
      return { inTabbar: !!el.closest('.portal-tabbar'), inPortal: !!el.closest('.portal-body'), bottom: rect.bottom }
    })
    if (focus.inPortal && !focus.inTabbar) expect(focus.bottom).toBeLessThanOrEqual(tabbarTop)
  }
})

test('reward history fits its card on a phone, with no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#stake-history')
  const table = page.locator('.reward-table-wrap')
  await table.scrollIntoViewIfNeeded()
  const fit = await table.evaluate((node) => {
    const card = node.closest('section')!.getBoundingClientRect()
    const rect = node.getBoundingClientRect()
    return { sideways: node.scrollWidth - node.clientWidth, right: rect.right, cardRight: card.right }
  })
  expect(fit.sideways).toBeLessThanOrEqual(0)
  expect(fit.right).toBeLessThanOrEqual(fit.cardRight)
  // Demo transaction hashes are shortened, so they are shown as text, not as explorer links.
  await expect(table.locator('a')).toHaveCount(0)
})

test('confirmation rows keep label and value on one baseline', async ({ page }) => {
  await page.goto('/#stake-pledge-confirm')
  const offsets = await page.locator('.confirmation-list > div').evaluateAll((rows) =>
    rows.map((row) => {
      const label = row.querySelector('dt')!.getBoundingClientRect()
      const value = row.querySelector('dd')!.getBoundingClientRect()
      return Math.abs(label.bottom - value.bottom)
    }),
  )
  expect(offsets.length).toBeGreaterThan(0)
  for (const offset of offsets) expect(offset).toBeLessThanOrEqual(3)
})

test('scroll areas the browser makes focusable show a keyboard ring', async ({ page }) => {
  await page.goto('/#notes')
  await page.keyboard.press('Tab')
  const ring = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement as HTMLElement)
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset) }
  })
  expect(ring.style).toBe('solid')
  expect(ring.width).toBeGreaterThanOrEqual(2)
  expect(ring.offset).toBeLessThan(0)
})
