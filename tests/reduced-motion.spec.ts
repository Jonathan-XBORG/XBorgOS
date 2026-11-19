import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('reduced motion reveals final states and removes ambient animation', async ({ page }) => {
  await page.goto('/#workspace')
  const styles = await page.locator('.conversation > .beat').first().locator(':scope > *').first().evaluate((node) => {
    const style = getComputedStyle(node)
    return {
      opacity: style.opacity,
      transform: style.transform,
      transitionDuration: style.transitionDuration,
    }
  })
  expect(styles.opacity).toBe('1')
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(styles.transform)
  expect(styles.transitionDuration).toBe('0s')
  const statusAnimations = await page.locator('.status-dot.is-live').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).animationName),
  )
  expect(statusAnimations.every((name) => name === 'none')).toBe(true)

  await page.goto('/#propr')
  await expect(page.locator('.scan')).toHaveCount(0)

  await page.goto('/#stake-active')
  await expect(page.locator('animateTransform')).toHaveCount(0)
})

test('reduced motion skips the Portal expansion', async ({ page }) => {
  await page.goto('/#workspace')
  await page.locator('[data-dock="stake"]').click()
  await expect(page.locator('.portal-app')).toBeVisible({ timeout: 100 })
  await expect(page).toHaveURL(/#stake-entry/)
  await expect(page.locator('.workspace.is-expanding')).toHaveCount(0)
})
