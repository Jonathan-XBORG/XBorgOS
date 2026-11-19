import { expect, test, type Locator } from '@playwright/test'

async function expectAccentFocus(locator: Locator) {
  // Focus rings are for keyboard users, so the check starts from a key press.
  await locator.page().keyboard.press('Tab')
  await locator.focus()
  const indicator = await locator.evaluate((node) => {
    const style = getComputedStyle(node)
    return `${style.outlineColor} ${style.boxShadow} ${style.filter}`
  })
  expect(indicator).toContain('133, 114, 252')
}

test('chamfered controls and tabs show an accent focus state', async ({ page }) => {
  await page.goto('/#workspace')
  await expectAccentFocus(page.locator('[data-dock="propr"]'))

  await page.locator('[data-dock="propr"]').press('Enter')
  await expectAccentFocus(page.getByRole('button', { name: 'Close' }))

  await page.goto('/#stake-pledge-amount')
  await expectAccentFocus(page.getByRole('button', { name: 'MAX', exact: true }))
  await page.goto('/#stake-active')
  await expectAccentFocus(page.locator('.portal-tabs').getByRole('button', { name: 'Positions' }))
})

test('product dialog traps focus and restores it to the keyboard trigger', async ({ page }) => {
  await page.goto('/#workspace')
  const trigger = page.locator('[data-dock="propr"]')
  await trigger.focus()
  await trigger.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'PROPR' })
  const close = page.getByRole('button', { name: 'Close' })
  const maximise = page.getByRole('button', { name: 'Maximise' })
  const visit = page.getByRole('link', { name: 'Visit propr.xyz' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(maximise).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(visit).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(maximise).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('Stake pledge can be completed with the keyboard', async ({ page }) => {
  await page.goto('/#stake-eligible')
  await page.getByRole('button', { name: 'Pledge XBG' }).focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Pledge XBG' })
  const amount = dialog.getByLabel('Amount to pledge')
  await expect(amount).toBeFocused()
  await page.keyboard.type('5000')
  await page.keyboard.press('Enter')
  await expect(dialog.getByRole('button', { name: 'Sign', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  const wallet = dialog.getByRole('region', { name: 'Demo wallet: Signature request' })
  await expect(wallet.getByRole('button', { name: 'Sign' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog.getByRole('button', { name: 'Pledging…' })).toBeVisible()
  const done = page.getByRole('dialog', { name: 'XBG pledged successfully' })
  await expect(done.getByRole('button', { name: 'Done' })).toBeFocused()
  await expect(done).toContainText('5,000 XBG pledged for Season 20.')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#stake-active/)
})

test('Stake window traps focus and closes back to its dock trigger', async ({ page }) => {
  await page.goto('/#workspace')
  const trigger = page.locator('[data-dock="stake"]')
  await trigger.focus()
  await trigger.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'STAKE' })
  const close = page.getByRole('button', { name: 'Close' })
  const maximise = page.getByRole('button', { name: 'Maximise' })
  const last = page.getByRole('button', { name: 'View leaderboard' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(maximise).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(last).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(maximise).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('Stake navigation focuses the selected view instead of resetting to Close', async ({ page }) => {
  await page.goto('/#stake-active')
  const close = page.getByRole('button', { name: 'Close' })
  await expect(close).toBeFocused()

  await page.locator('.portal-tabs').getByRole('button', { name: 'Positions' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#stake-positions/)
  await expect(page.locator('.portal-body')).toBeFocused()
  await expect(close).not.toBeFocused()
})

test('Stake task modals make the background inert and restore their trigger', async ({ page }) => {
  await page.goto('/#stake-active')
  const trigger = page.getByRole('button', { name: 'Pledge more', exact: true })
  await trigger.focus()
  await page.keyboard.press('Enter')

  const stakeDialog = page.getByRole('dialog', { name: 'Pledge more XBG' })
  await expect(stakeDialog).toBeVisible()
  await expect(page.locator('.portal-shell')).toHaveAttribute('inert', '')
  await page.keyboard.press('Escape')

  await expect(stakeDialog).toHaveCount(0)
  await expect(page.locator('.portal-shell')).not.toHaveAttribute('inert', '')
  await expect(trigger).toBeFocused()
})

test('Stake keeps programmatic focus out of the modal background', async ({ page }) => {
  await page.goto('/#workspace')
  await page.locator('[data-dock="stake"]').click()
  const close = page.getByRole('button', { name: 'Close' })
  await expect(close).toBeFocused()

  await page.locator('[data-dock="propr"]').evaluate((node) => (node as HTMLElement).focus())
  await expect(close).toBeFocused()
})

test('browser Back closes Stake and restores its dock launcher', async ({ page }) => {
  await page.goto('/#workspace')
  const trigger = page.locator('[data-dock="stake"]')
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'STAKE' })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/#workspace/)
  await expect(page.getByRole('dialog', { name: 'STAKE' })).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('review navigation between apps restores focus to the app that closes', async ({ page }) => {
  await page.goto('/#workspace')
  await page.locator('[data-dock="stake"]').click()
  await expect(page.getByRole('dialog', { name: 'STAKE' })).toBeVisible()

  const productTrigger = page.locator('[data-dock="propr"]')
  await page.getByLabel('Review screen').selectOption('propr')
  const productDialog = page.getByRole('dialog', { name: 'PROPR' })
  await expect(productDialog).toBeVisible()
  await productDialog.getByRole('button', { name: 'Close' }).click()

  await expect(page).toHaveURL(/#workspace/)
  await expect(productTrigger).toBeFocused()
})
