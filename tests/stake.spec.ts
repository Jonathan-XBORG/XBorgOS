import { expect, test, type Page } from '@playwright/test'
import { STAKE_SCREENS } from '../src/screens'

async function expectPortalHeaderChildrenToFit(page: Page) {
  const bounds = await page
    .locator('.window-portal .window-title > *, .portal-header > *, .portal-utility > *')
    .evaluateAll((children) =>
    children.map((child) => {
      const rect = child.getBoundingClientRect()
      const parent = child.parentElement?.getBoundingClientRect()
      return {
        top: parent ? rect.top - parent.top : rect.top,
        bottom: parent ? rect.bottom - parent.top : rect.bottom,
        height: parent?.height ?? 64,
      }
    }),
  )

  expect(bounds.length).toBeGreaterThan(0)
  for (const child of bounds) {
    expect(child.top).toBeGreaterThanOrEqual(0)
    expect(child.bottom).toBeLessThanOrEqual(child.height)
  }
}

async function expectPortalContentToFitLayout(page: Page) {
  const bounds = await page.locator('.portal-entry-content, .portal-body').evaluate((content) => {
    const rect = content.getBoundingClientRect()
    const shell = content.closest('.portal-shell') as HTMLElement | null
    const tabs = shell?.querySelector('.portal-tabs') as HTMLElement | null
    return {
      isEntry: content.classList.contains('portal-entry-content'),
      viewportWidth: window.innerWidth,
      width: rect.width,
      left: rect.left,
      right: window.innerWidth - rect.right,
      shellRight: shell ? shell.getBoundingClientRect().right : null,
      tabsRight: tabs ? tabs.getBoundingClientRect().right : null,
    }
  })

  expect(bounds.width).toBeLessThanOrEqual(1200)
  if (bounds.isEntry) {
    expect(Math.abs(bounds.left - bounds.right)).toBeLessThanOrEqual(1)
  } else {
    expect(Math.abs(bounds.left - Number(bounds.tabsRight))).toBeLessThanOrEqual(1)
    expect(Math.abs(bounds.viewportWidth - bounds.right - Number(bounds.shellRight))).toBeLessThanOrEqual(1)
  }
}

for (const id of STAKE_SCREENS) {
  test(`desktop ${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/#${id}`)
    await expect(page.locator('.portal-app')).toBeVisible()
    await expectPortalHeaderChildrenToFit(page)
    await expectPortalContentToFitLayout(page)
    await page.screenshot({ path: `review-shots/stake/1440-${id}.png`, fullPage: false })
  })

  test(`mobile ${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/#${id}`)
    await expect(page.locator('.portal-app')).toBeVisible()
    await expectPortalHeaderChildrenToFit(page)
    await page.screenshot({ path: `review-shots/stake/390-${id}.png`, fullPage: false })
  })
}

test('Stake content fits its layout at the 1280px desktop boundary', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  for (const id of STAKE_SCREENS) {
    await page.goto(`/#${id}`)
    await expectPortalContentToFitLayout(page)
  }
})

test('Stake visitor view shows one wallet action before application navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#stake-entry')
  const entry = page.locator('.portal-entry-content')
  await expect(entry.getByRole('heading', { name: 'Hold XBG, earn XBG' })).toBeVisible()
  await expect(entry.getByRole('button', { name: 'Connect Wallet' })).toBeVisible()
  await expect(entry).toContainText('403 XBG')
  await expect(page.getByRole('navigation', { name: 'Stake' })).toHaveCount(0)
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
]) {
  test(`Stake visitor primary action fits at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#stake-entry')
    const bottom = await page.locator('.portal-entry-content .btn-primary').evaluate((button) =>
      button.getBoundingClientRect().bottom,
    )
    expect(bottom).toBeLessThanOrEqual(viewport.height)
  })
}

test('mobile Stake controls keep usable touch target padding', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#stake-active')
  await page.waitForTimeout(350)
  const metrics = await page.getByRole('button', { name: 'Pledge more' }).evaluate((button) => {
    const style = getComputedStyle(button)
    const buttonBounds = button.getBoundingClientRect()
    const range = document.createRange()
    range.selectNodeContents(button)
    const labelBounds = range.getBoundingClientRect()
    return {
      clientWidth: button.clientWidth,
      labelWidth: labelBounds.width,
      paddingLeft: parseFloat(style.paddingLeft),
      paddingRight: parseFloat(style.paddingRight),
      height: buttonBounds.height,
    }
  })
  expect(metrics.labelWidth).toBeLessThanOrEqual(metrics.clientWidth)
  expect(metrics.paddingLeft).toBeGreaterThanOrEqual(10)
  expect(metrics.paddingRight).toBeGreaterThanOrEqual(10)
  expect(metrics.height).toBeGreaterThanOrEqual(44)
})

for (const width of [1280, 1440]) {
  test(`Stake uses a navigation sidebar at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#stake-active')
    const edges = await page.evaluate(() => {
      const tabs = document.querySelector('.portal-tabs') as HTMLElement
      const body = document.querySelector('.portal-body') as HTMLElement
      return {
        tabsLeft: tabs.getBoundingClientRect().left,
        tabsRight: tabs.getBoundingClientRect().right,
        tabsWidth: tabs.getBoundingClientRect().width,
        bodyLeft: body.getBoundingClientRect().left,
      }
    })
    expect(edges.tabsWidth).toBeGreaterThanOrEqual(160)
    expect(edges.tabsWidth).toBeLessThanOrEqual(200)
    expect(edges.tabsLeft).toBeLessThan(edges.bodyLeft)
    expect(edges.tabsRight).toBeLessThanOrEqual(edges.bodyLeft)
  })
}

test('pledged and earning shows the pledge, the estimate and the rank', async ({ page }) => {
  await page.goto('/#stake-active')
  await expect(page.locator('[data-figure="pledged"]')).toContainText('250,000')
  await expect(page.locator('[data-figure="estimate"]')).toContainText('1,307 XBG')
  await expect(page.locator('[data-figure="multiplier"]')).toHaveText('×1.25')
  await expect(page.getByText('Eligible · PROPR Trader')).toBeVisible()
  await expect(page.locator('[data-metric="rank"]')).toContainText('of 291')
})

test('Stake navigation has three destinations and no missions', async ({ page }) => {
  await page.goto('/#stake-active')
  const nav = page.getByRole('navigation', { name: 'Stake' }).first()
  await expect(nav.getByRole('button')).toHaveText(['Rewards', 'Positions', 'History'])
  const stake = page.locator('.window-portal')
  await expect(stake.getByText('Missions')).toHaveCount(0)
  await expect(stake.getByText('Access level')).toHaveCount(0)
})

test('wallet addresses preserve hexadecimal case', async ({ page }) => {
  await page.goto('/#stake-active')
  const wallet = page.locator('.topbar .wallet-control')
  await expect(wallet).toContainText('0x8f2a…c41d')
  await expect(wallet).toHaveCSS('text-transform', 'none')
})

test('Completed seasons uses configured illustrative data', async ({ page }) => {
  await page.goto('/#stake-history')
  const season = page.getByRole('row').filter({ hasText: 'Season 18' })
  await expect(season).toContainText('1,126 XBG')
  await expect(season).toContainText('Distributed')
})

test('old Portal review links open their Stake state under its current name', async ({ page }) => {
  const aliases: [string, string][] = [
    ['portal-entry', 'stake-entry'],
    ['portal-unstaked', 'stake-eligible'],
    ['portal-stake-preview', 'stake-pledge-confirm'],
    ['portal-home', 'stake-active'],
    ['portal-participate', 'stake-active'],
    ['portal-rewards', 'stake-history'],
    ['portal-legacy', 'stake-positions'],
  ]
  for (const [from, to] of aliases) {
    await page.goto(`/#${from}`)
    await expect(page).toHaveURL(new RegExp(`#${to}$`))
    await expect(page.getByLabel('Review screen')).toHaveValue(to)
    await expect(page.getByRole('dialog', { name: 'STAKE' })).toBeVisible()
  }
})
