import { expect, test, type Page } from '@playwright/test'

function pledgeDialog(page: Page, name = 'Pledge XBG') {
  return page.getByRole('dialog', { name })
}

test('a visitor connects, verifies, becomes eligible and pledges', async ({ page }) => {
  await page.goto('/#stake-entry')
  await expect(page.getByRole('heading', { name: 'Hold XBG, earn XBG' })).toBeVisible()
  await page.locator('.portal-entry-content').getByRole('button', { name: 'Connect Wallet' }).click()
  await expect(page).toHaveURL(/#stake-not-verified/)
  await expect(page.getByText('Not verified', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Complete any option to activate rewards' })).toBeVisible()

  // Verify: validation, a cancelled signature, then success.
  await page.locator('[data-requirement="propr"]').getByRole('button', { name: 'Verify' }).click()
  const verify = page.getByRole('dialog', { name: 'Verify your wallet' })
  await verify.getByRole('button', { name: 'Next' }).click()
  await expect(verify.getByRole('alert')).toHaveText('Enter a valid email address.')
  await verify.getByLabel('Email').fill('trader@example.com')
  await verify.getByRole('button', { name: 'Next' }).click()
  await verify.getByRole('button', { name: 'Sign', exact: true }).click()
  await expect(verify.getByRole('button', { name: 'Waiting for signature…' })).toBeDisabled()
  await verify.getByRole('region', { name: 'Demo wallet: Signature request' }).getByRole('button', { name: 'Reject' }).click()
  await expect(verify.getByRole('alert')).toContainText('You cancelled the signature. Nothing was linked.')
  await verify.getByRole('button', { name: 'Try again' }).click()
  await verify.getByRole('region', { name: 'Demo wallet: Signature request' }).getByRole('button', { name: 'Sign' }).click()
  await expect(verify.getByText('Email linked to your wallet.')).toBeVisible()
  await verify.getByRole('button', { name: 'Done' }).click()
  await expect(page).toHaveURL(/#stake-linked/)
  await expect(page.getByText('Not eligible', { exact: true })).toBeVisible()

  // Re-check finds the PROPR purchase.
  await page.locator('[data-requirement="propr"]').getByRole('button', { name: 'Re-check' }).click()
  await expect(page.locator('[data-requirement="propr"]').getByRole('button', { name: 'Checking…' })).toBeDisabled()
  await expect(page.getByText('Eligible · PROPR Trader')).toBeVisible()
  await expect(page).toHaveURL(/#stake-eligible/)

  // Pledge: validation, MAX, back, a cancelled signature, then success.
  await page.getByRole('button', { name: 'Pledge XBG' }).click()
  const dialog = pledgeDialog(page)
  await dialog.getByRole('button', { name: 'Next' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Enter an amount up to your available XBG balance.')
  await dialog.getByLabel('Amount to pledge').fill('400000')
  await dialog.getByRole('button', { name: 'Next' }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await dialog.getByRole('button', { name: 'MAX' }).click()
  await expect(dialog.getByLabel('Amount to pledge')).toHaveValue('298750')
  await expect(dialog.getByText('Available: 298,750 XBG, including 250,000 XBG currently staked.')).toBeVisible()
  await dialog.getByLabel('Amount to pledge').fill('25000')
  await dialog.getByRole('button', { name: 'Next' }).click()
  await expect(dialog.locator('.confirmation-list')).toContainText('25,000 XBG')
  await expect(dialog.locator('.confirmation-list')).toContainText('×1.25')
  await dialog.getByRole('button', { name: 'Back' }).click()
  await expect(dialog.getByLabel('Amount to pledge')).toHaveValue('25000')
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByRole('button', { name: 'Sign', exact: true }).click()
  const wallet = dialog.getByRole('region', { name: 'Demo wallet: Signature request' })
  await expect(wallet).toContainText('Amount: 25000 XBG')
  await wallet.getByRole('button', { name: 'Reject' }).click()
  await expect(dialog.getByRole('alert')).toContainText('You cancelled the signature, so nothing was pledged.')
  await dialog.getByRole('button', { name: 'Sign again' }).click()
  await wallet.getByRole('button', { name: 'Sign' }).click()
  await expect(dialog.getByRole('button', { name: 'Pledging…' })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeDisabled()
  const done = pledgeDialog(page, 'XBG pledged successfully')
  await expect(done).toContainText('25,000 XBG pledged for Season 20.')
  await done.getByRole('button', { name: 'Done' }).click()

  await expect(page).toHaveURL(/#stake-active/)
  await expect(page.locator('[data-figure="pledged"]')).toContainText('25,000')
  await expect(page.getByText('Pledged for Season 20 · earning')).toBeVisible()
  // Points move only at the daily snapshot.
  await expect(page.locator('[data-metric="rank"]')).toContainText('Not ranked yet')
})

test('a refused email is explained and cannot be retried', async ({ page }) => {
  await page.goto('/#stake-verify-email')
  const verify = page.getByRole('dialog', { name: 'Verify your wallet' })
  await verify.getByLabel('Email').fill('taken@example.com')
  await verify.getByRole('button', { name: 'Next' }).click()
  await verify.getByRole('button', { name: 'Sign', exact: true }).click()
  await verify.getByRole('region', { name: 'Demo wallet: Signature request' }).getByRole('button', { name: 'Sign' }).click()
  await expect(verify.getByRole('alert')).toContainText('This email can’t be linked to this wallet.')
  await expect(verify.getByRole('button', { name: 'Verification refused' })).toBeDisabled()
})

test('a wallet with no XBG is sent to buy some', async ({ page }) => {
  await page.goto('/#stake-no-xbg')
  await expect(page.getByRole('button', { name: 'Pledge XBG' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Buy XBG' }).click()
  const buy = page.getByRole('dialog', { name: 'Get XBG' })
  await expect(buy.getByRole('link')).toHaveCount(3)
  await buy.getByRole('button', { name: 'Add demo XBG to this wallet' }).click()
  await expect(page.getByRole('status')).toContainText('48,750 XBG added to the demo wallet.')
  await expect(page).toHaveURL(/#stake-not-verified/)
  await expect(page.getByRole('button', { name: 'Pledge XBG' })).toBeVisible()
})

test('a lost connection asks the holder to check before trying again', async ({ page }) => {
  await page.goto('/#stake-pledge-lost')
  const dialog = pledgeDialog(page)
  await expect(dialog.getByRole('alert')).toContainText('We lost contact before confirming.')
  await dialog.getByRole('button', { name: 'Refresh and check' }).click()
  await expect(page.getByRole('status')).toContainText('Checked. 25,000 XBG pledge went through.')
  await expect(page).toHaveURL(/#stake-active/)

  await page.goto('/#stake-pledge-refused')
  await expect(pledgeDialog(page).getByRole('alert')).toContainText('That is more than your available XBG.')
  await pledgeDialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
  await expect(page).toHaveURL(/#stake-eligible/)
})

test('gated states explain why pledging is not available', async ({ page }) => {
  const cases: [string, string][] = [
    ['stake-upcoming', 'Season 21 opens 1 Nov'],
    ['stake-season-closed', 'Season 21 opens soon'],
    ['stake-balance-error', 'Balance unavailable'],
  ]
  for (const [hash, label] of cases) {
    await page.goto(`/#${hash}`)
    await expect(page.getByRole('button', { name: label })).toBeDisabled()
  }
  await page.goto('/#stake-all-pledged')
  await expect(page.getByText('All of your XBG is pledged')).toBeVisible()
  await page.goto('/#stake-check-unavailable')
  await expect(page.getByText('Verification temporarily unavailable')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pledge XBG' })).toBeEnabled()
})

test('an ended staking position can be unstaked through the demo wallet', async ({ page }) => {
  await page.goto('/#stake-positions')
  await expect(page.getByText('New staking is closed. Your positions are untouched and end on their original dates.')).toBeVisible()
  const position = page.locator('[data-position="2"]')
  await expect(position).toContainText('Available to unstake')
  await expect(page.locator('[data-position="1"]').getByRole('button')).toHaveCount(0)

  await position.getByRole('button', { name: 'Unstake XBG' }).click()
  const prompt = page.getByRole('dialog', { name: 'Confirm in wallet' })
  await expect(prompt).toContainText('70,000 XBG')
  await prompt.getByRole('button', { name: 'Reject' }).click()
  await expect(position.getByRole('alert')).toHaveText('Transaction rejected')

  await position.getByRole('button', { name: 'Unstake XBG' }).click()
  await prompt.getByRole('button', { name: 'Confirm' }).click()
  await expect(position.getByRole('button', { name: 'Confirming…' })).toBeDisabled()
  await expect(position).toContainText('Unstaked successfully')
  await expect(position).toContainText('Unstaked, XBG returned to your wallet')

  await page.locator('.portal-tabs').getByRole('button', { name: 'Rewards' }).click()
  await expect(page.locator('.balance-row')).toContainText('In wallet118,750 XBG')
  await expect(page.locator('.balance-row')).toContainText('Staked180,000 XBG')
})

test('the leaderboard pins your rank and pages through every wallet', async ({ page }) => {
  await page.goto('/#stake-active')
  await page.locator('[data-metric="rank"]').getByRole('button', { name: 'View leaderboard' }).click()
  const board = page.getByRole('dialog', { name: 'Season 20 leaderboard · live' })
  await expect(board.locator('.your-rank')).toContainText('Your rank')
  await expect(board.locator('tbody tr')).toHaveCount(20)
  await board.getByRole('button', { name: 'Load more' }).click()
  await expect(board.locator('tbody tr')).toHaveCount(40)
  const rank = Number((await board.locator('.your-rank').getAttribute('data-rank')) ?? 0)
  while ((await board.locator('tbody tr').count()) < rank) {
    await board.getByRole('button', { name: 'Load more' }).click()
  }
  await expect(board.locator('tbody tr.is-you')).toContainText('(you)')
  await expect(board.locator('tbody tr.is-you')).toContainText(`#${rank}`)
})

test('completed seasons load in pages and the final allocations open', async ({ page }) => {
  await page.goto('/#stake-history')
  await expect(page.locator('tbody tr')).toHaveCount(4)
  await page.getByRole('button', { name: 'Load more…' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(6)

  await page.goto('/#stake-positions')
  await page.getByRole('button', { name: 'See final allocations' }).click()
  const allocations = page.getByRole('dialog', { name: 'Final PROPR allocations' })
  await expect(allocations).toContainText('130,000,000')
  for (let i = 0; i < 3 && !(await allocations.locator('tbody tr.is-you').count()); i += 1) {
    await allocations.getByRole('button', { name: 'Load more' }).click()
  }
  await expect(allocations.locator('tbody tr.is-you')).toContainText('184,166.67')
})

test('the boost catalogue opens from the multiplier card', async ({ page }) => {
  await page.goto('/#stake-active')
  const toggle = page.getByRole('button', { name: 'See all boosts' })
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Hide available boosts' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#available-boosts')).toContainText('Prometheus NFT')
  await expect(page.locator('#available-boosts')).toContainText('Community App Booster')
})

test('Reset Demo State returns Stake to its visitor view', async ({ page }) => {
  await page.goto('/#stake-active')
  await page.getByRole('button', { name: 'Reset Demo State' }).click()
  await expect(page).toHaveURL(/#stake-entry/)
  await expect(page.getByRole('heading', { name: 'Hold XBG, earn XBG' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Stake' })).toHaveCount(0)
  await expect(page.locator('.topbar').getByRole('button', { name: 'Connect Wallet' })).toBeVisible()
})

test('browser history steps through the Stake journey and keeps its state', async ({ page }) => {
  await page.goto('/#stake-pledge-confirm')
  const dialog = pledgeDialog(page)
  await dialog.getByRole('button', { name: 'Sign', exact: true }).click()
  await dialog.getByRole('region', { name: 'Demo wallet: Signature request' }).getByRole('button', { name: 'Sign' }).click()
  await pledgeDialog(page, 'XBG pledged successfully').getByRole('button', { name: 'Done' }).click()
  await expect(page).toHaveURL(/#stake-active/)

  await page.locator('.portal-tabs').getByRole('button', { name: 'History' }).click()
  await expect(page).toHaveURL(/#stake-history/)

  await page.goBack()
  await expect(page).toHaveURL(/#stake-active/)
  await expect(page.locator('[data-figure="pledged"]')).toContainText('25,000')

  await page.goForward()
  await expect(page).toHaveURL(/#stake-history/)
  await expect(page.getByRole('heading', { name: 'Completed seasons' })).toBeVisible()
})

test('Earn opens from the dock as an empty window and closes back to its tile', async ({ page }) => {
  await page.goto('/#workspace')
  const tile = page.locator('[data-dock="earn"]')
  await expect(tile).toHaveAccessibleName('Earn')
  await tile.focus()
  await tile.press('Enter')
  await expect(page).toHaveURL(/#earn/)
  const earn = page.getByRole('dialog', { name: 'EARN' })
  await expect(earn).toBeVisible()
  await expect(tile).toHaveAttribute('aria-current', 'true')
  await expect(earn.locator('.earn-body')).toBeEmpty()
  await expect(earn.getByRole('button', { name: 'Close' })).toBeFocused()
  await expect(earn.getByRole('button', { name: 'Maximise' })).toBeVisible()

  await page.goBack()
  await expect(earn).toHaveCount(0)
  await expect(tile).toBeFocused()
  await page.goForward()
  await expect(page.getByRole('dialog', { name: 'EARN' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/#workspace/)
})

test('Stake and Earn on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#stake-active')
  await page.waitForTimeout(350)
  const navigation = page.locator('.portal-tabbar')
  await expect(navigation.getByRole('button')).toHaveText(['Rewards', 'Positions', 'History'])
  const heights = await navigation.getByRole('button').evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height),
  )
  expect(heights.every((height) => height >= 44)).toBe(true)
  expect(await page.evaluate(() => document.scrollingElement?.scrollWidth)).toBe(390)
  await page.waitForTimeout(350)
  const buttonHeights = await page.locator('.portal-app button:visible').evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height),
  )
  expect(buttonHeights.every((height) => height >= 44)).toBe(true)

  await page.goto('/#workspace')
  await page.locator('[data-dock="earn"]').click()
  const earn = page.locator('.window-earn')
  await expect.poll(() => earn.evaluate((node) => node.getBoundingClientRect().width)).toBe(390)
  await expect.poll(() => earn.evaluate((node) => node.getBoundingClientRect().height)).toBe(844)
})
