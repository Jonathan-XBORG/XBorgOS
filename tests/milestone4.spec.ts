import { expect, test } from '@playwright/test'

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`Milestone 4 Portal entry at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#stake-entry')
    const action = page.locator('.portal-entry-content .btn-primary')
    await expect(action).toBeVisible()
    const bottom = await action.evaluate((button) => button.getBoundingClientRect().bottom)
    expect(bottom).toBeLessThanOrEqual(viewport.height)
    await page.screenshot({
      path: `review-shots/m4-${viewport.width}-stake-entry.png`,
      fullPage: false,
    })
  })
}

for (const state of [
  { id: 'stake-active', width: 1440, height: 900 },
  { id: 'stake-active', width: 390, height: 844 },
  { id: 'stake-positions', width: 390, height: 844 },
]) {
  test(`Milestone 4 ${state.id} at ${state.width} by ${state.height}`, async ({ page }) => {
    await page.setViewportSize({ width: state.width, height: state.height })
    await page.goto(`/#${state.id}`)
    await page.screenshot({
      path: `review-shots/m4-${state.width}-${state.id}.png`,
      fullPage: false,
    })
  })
}
