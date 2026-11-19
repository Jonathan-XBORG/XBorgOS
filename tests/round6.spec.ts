import { expect, test } from '@playwright/test'

// Round 6: the sky behind the desktop and the Ask field in the menu bar.

test('the sky sits behind every window and never takes a click', async ({ page }) => {
  await page.goto('/#workspace')
  const sky = page.locator('canvas.sky')
  await expect(sky).toHaveCount(1)
  await expect(sky).toHaveAttribute('aria-hidden', 'true')
  await expect(sky).toHaveCSS('pointer-events', 'none')
  await expect(sky).toHaveCSS('z-index', '0')
})

test('⌘K opens Ask, a question answers in place and its action opens the app', async ({ page }) => {
  await page.goto('/#workspace')
  await expect(page.getByRole('button', { name: /Ask XBorg/ })).toBeVisible()
  await page.keyboard.press('ControlOrMeta+k')
  const panel = page.getByRole('dialog', { name: 'Ask XBorg' })
  await expect(panel).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Ask XBorg' })).toBeFocused()

  await page.keyboard.type('rewards')
  await expect(panel.getByRole('option')).toHaveCount(2)
  await page.keyboard.press('Enter')
  await expect(panel.getByText('Your XBG stays in your wallet the whole time.')).toBeVisible()

  await page.keyboard.press('Enter')
  await expect(panel).toHaveCount(0)
  await expect(page).toHaveURL(/#stake-entry$/)
})

test('an app typed by name opens first', async ({ page }) => {
  await page.goto('/#workspace')
  await page.getByRole('button', { name: /Ask XBorg/ }).click()
  await page.keyboard.type('propr')
  await expect(page.getByRole('option').first()).toHaveText(/Propr/)
  await expect(page.getByRole('option').first()).toHaveText(/Open/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#propr$/)
})

test('Escape in Ask closes Ask only, never the window behind it', async ({ page }) => {
  await page.goto('/#stake-active')
  await expect(page.getByRole('button', { name: /Ask XBorg/ })).toBeVisible()
  await page.keyboard.press('ControlOrMeta+k')
  await expect(page.getByRole('dialog', { name: 'Ask XBorg' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Ask XBorg' })).toHaveCount(0)
  await expect(page).toHaveURL(/#stake-active$/)
  await expect(page.getByRole('button', { name: /Ask XBorg/ })).toBeFocused()
})

test('the connected wallet shows its balance before its address', async ({ page }) => {
  await page.goto('/#stake-active')
  await expect(page.locator('.topbar .wallet-control.is-connected')).toHaveText(/48,750 XBG.*0x8f2a…c41d/)
})

test('Ask is desktop only', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#workspace')
  await expect(page.locator('.ask')).toBeHidden()
})
