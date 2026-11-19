import { expect, test } from '@playwright/test'

test('Present mode hides the review bar and survives navigation', async ({ page }) => {
  await page.goto('/?present=1#workspace')
  await expect(page.locator('.review')).toHaveCount(0)
  await page.locator('[data-dock="propr"]').click()
  await expect(page).toHaveURL(/present=1#propr/)
  await expect(page.locator('.review')).toHaveCount(0)
  await expect(page.locator('.present-next')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Next screen' })).toHaveCount(0)
})

test('prototype bar keeps only its label, previous action and screen picker', async ({ page }) => {
  await page.goto('/#workspace')
  const review = page.locator('.review')
  await expect(review).toBeVisible()
  await expect(review.locator(':scope > *')).toHaveCount(3)
  await expect(review.getByRole('button')).toHaveCount(1)
  await expect(review.getByRole('button', { name: 'Previous screen' })).toBeVisible()
  await expect(review.getByRole('combobox', { name: 'Review screen' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next screen' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Play the journey' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Present' })).toHaveCount(0)
})

test('Previous wraps from Workspace to Design notes', async ({ page }) => {
  await page.goto('/#workspace')
  await page.getByRole('button', { name: 'Previous screen' }).click()
  await expect(page).toHaveURL(/#notes/)
  await expect(page.getByRole('heading', { name: 'Design notes' })).toBeVisible()
})

test('mobile review controls stay inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#stake-active')
  const bounds = await page.locator('.review > *').evaluateAll((controls) =>
    controls.map((control) => {
      const rect = control.getBoundingClientRect()
      return { left: rect.left, right: rect.right }
    }),
  )
  for (const control of bounds) {
    expect(control.left).toBeGreaterThanOrEqual(0)
    expect(control.right).toBeLessThanOrEqual(390)
  }
  const width = await page.locator('.review').evaluate((node) => node.getBoundingClientRect().width)
  expect(width).toBeLessThanOrEqual(280)
})
