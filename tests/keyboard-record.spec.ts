import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({
  video: { mode: 'on', size: { width: 1440, height: 900 } },
})

async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 20; index += 1) {
    if (await target.evaluate((node) => node === document.activeElement).catch(() => false)) return
    await page.keyboard.press('Tab')
    await page.waitForTimeout(180)
  }
  await expect(target).toBeFocused()
}

test('full keyboard traversal from workspace through Stake', async ({ page }) => {
  await page.goto('/#workspace')
  await page.waitForTimeout(500)

  await page.keyboard.press('Shift+Tab')
  await page.waitForTimeout(300)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)
  await tabTo(page, page.locator('[data-product="propr"]'))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  const portalPanelAction = page.locator('.portal-panel .btn-primary')
  await tabTo(page, portalPanelAction)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#stake-entry/)
  await page.waitForTimeout(500)

  await tabTo(page, page.locator('.portal-entry-content .btn-primary'))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#stake-not-verified/)

  await tabTo(page, page.getByRole('button', { name: 'Pledge XBG' }))
  await page.keyboard.press('Enter')
  const pledgeDialog = page.getByRole('dialog', { name: 'Pledge XBG' })
  await expect(pledgeDialog.getByLabel('Amount to pledge')).toBeFocused()
  await page.keyboard.type('25000')
  await page.keyboard.press('Enter')
  await expect(pledgeDialog.getByRole('button', { name: 'Sign', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  await page.keyboard.press('Enter')
  const done = page.getByRole('dialog', { name: 'XBG pledged successfully' })
  await expect(done.getByRole('button', { name: 'Done' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#stake-not-earning/)

  await tabTo(page, page.locator('.portal-tabs').getByRole('button', { name: 'Positions' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#stake-positions/)

  await tabTo(page, page.locator('.portal-tabs').getByRole('button', { name: 'History' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#stake-history/)
  await page.waitForTimeout(800)

  const video = page.video()
  await page.close()
  await video?.saveAs('review-shots/m4-keyboard-traversal.webm')
})
