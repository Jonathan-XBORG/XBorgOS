import { expect, test, type Page } from '@playwright/test'

const ADDRESS = '0x8f2a…c41d'

async function rectOf(page: Page, selector: string) {
  return page.locator(selector).evaluate((node) => {
    const r = node.getBoundingClientRect()
    return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom }
  })
}

async function settle(page: Page, selector: string) {
  await expect
    .poll(() => page.locator(selector).evaluate((node) => getComputedStyle(node).transform))
    .toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/)
}

// Size changes glide, so read the window once it stops moving.
async function settledRect(page: Page, selector: string) {
  let last = ''
  await expect
    .poll(async () => {
      const now = JSON.stringify(await rectOf(page, selector))
      const stable = now === last
      last = now
      return stable
    }, { intervals: [80] })
    .toBe(true)
  return JSON.parse(last) as Awaited<ReturnType<typeof rectOf>>
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 })
  await page.mouse.move(to.x, to.y, { steps: 4 })
  await page.mouse.up()
  await page.waitForTimeout(60)
}

test.describe('design system', () => {
  test('main calls to action carry a glass edge', async ({ page }) => {
    await page.goto('/#stake-active')
    const ring = await page.getByRole('button', { name: 'Pledge more' }).evaluate((node) => {
      const before = getComputedStyle(node, '::before')
      return { content: before.content, shadow: before.boxShadow, inset: before.top }
    })
    expect(ring.content).not.toBe('none')
    expect(ring.shadow).toContain('inset')
    expect(ring.inset).toBe('-4px')
  })

  test('the system screen documents every component and its exceptions', async ({ page }) => {
    await page.goto('/#system')
    for (const name of ['Colour', 'Type', 'Button', 'Wallet control', 'Bubble', 'Window chrome', 'Dock tile', 'Badge', 'Card and stat row', 'Tabs', 'Input', 'Modal and toast', 'Exceptions']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('radio')).toHaveCount(0)
  })
})

test.describe('wallet', () => {
  test('disconnected Connect Wallet opens Stake at its visitor view', async ({ page }) => {
    await page.goto('/#workspace')
    await page.locator('.topbar').getByRole('button', { name: 'Connect Wallet' }).click()
    await expect(page).toHaveURL(/#stake-entry/)
    const entryConnect = page.locator('.portal-entry-content').getByRole('button', { name: 'Connect Wallet' })
    await entryConnect.click()
    await expect(page.locator('.topbar .wallet-control.is-connecting')).toBeVisible()
    await expect(page).toHaveURL(/#stake-not-verified/)
    await expect(page.locator('.topbar').getByRole('button', { name: `Wallet ${ADDRESS}` })).toBeVisible()
  })

  test('menu bar and Stake always agree', async ({ page }) => {
    await page.goto('/#stake-active')
    await expect(page.locator('.topbar').getByRole('button', { name: `Wallet ${ADDRESS}` })).toBeVisible()
    // The Stake header does not repeat the wallet. The menu bar holds it.
    await expect(page.locator('.wallet-chip')).toHaveCount(0)

    await page.getByRole('button', { name: 'Reset Demo State' }).click()
    await expect(page).toHaveURL(/#stake-entry/)
    await expect(page.locator('.topbar').getByRole('button', { name: 'Connect Wallet' })).toBeVisible()
  })

  test('connected menu opens Stake, copies and disconnects', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/#stake-active')
    await page.getByRole('button', { name: 'Close' }).click()
    const trigger = page.locator('.topbar').getByRole('button', { name: `Wallet ${ADDRESS}` })

    await trigger.click()
    const menu = page.getByRole('menu', { name: 'Wallet' })
    await expect(menu.getByRole('menuitem')).toHaveText(['Open Stake', 'Copy address', 'Disconnect'])
    await expect(menu.getByRole('menuitem').first()).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(menu.getByRole('menuitem', { name: 'Copy address' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await trigger.click()
    await page.getByRole('menuitem', { name: 'Copy address' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ADDRESS)

    await expect(menu).toHaveCount(0)
    await trigger.click()
    await page.getByRole('menuitem', { name: 'Open Stake' }).click()
    await expect(page).toHaveURL(/#stake-active/)

    await page.getByRole('button', { name: 'Close' }).click()
    await trigger.click()
    await page.getByRole('menuitem', { name: 'Disconnect' }).click()
    await expect(page.locator('.topbar').getByRole('button', { name: 'Connect Wallet' })).toBeFocused()
  })

  test('disconnecting while Stake is open returns it to the visitor view', async ({ page }) => {
    await page.goto('/#stake-active')
    await page.locator('.topbar').getByRole('button', { name: `Wallet ${ADDRESS}` }).click()
    await expect(page.getByRole('menuitem', { name: 'Open Stake' })).toBeFocused()
    await page.getByRole('menuitem', { name: 'Disconnect' }).click()
    await expect(page).toHaveURL(/#stake-entry/)
    await expect(page.locator('.topbar').getByRole('button', { name: 'Connect Wallet' })).toBeVisible()
  })
})

test.describe('resizable windows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('title bar moves the window and the window stays on screen', async ({ page }) => {
    await page.goto('/#propr')
    await settle(page, '.window-product')
    const start = await rectOf(page, '.window-product')
    await drag(page, { x: start.x + 60, y: start.y + 20 }, { x: start.x + 260, y: start.y + 60 })
    const moved = await rectOf(page, '.window-product')
    expect(Math.round(moved.x - start.x)).toBe(200)
    expect(Math.round(moved.y - start.y)).toBe(40)

    await drag(page, { x: moved.x + 60, y: moved.y + 20 }, { x: -400, y: -400 })
    const clamped = await rectOf(page, '.window-product')
    const dock = await rectOf(page, '.dock-tray')
    expect(clamped.x).toBeGreaterThanOrEqual(0)
    expect(clamped.y).toBeGreaterThanOrEqual(44)
    expect(clamped.bottom).toBeLessThanOrEqual(dock.y)
  })

  test('every edge and corner resizes, down to the minimum size', async ({ page }) => {
    await page.goto('/#propr')
    await settle(page, '.window-product')
    await expect(page.locator('.window-product .window-resize')).toHaveCount(8)
    const cursors = await page.locator('.window-product .window-resize').evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).cursor),
    )
    expect(new Set(cursors)).toEqual(new Set(['ns-resize', 'ew-resize', 'nesw-resize', 'nwse-resize']))

    const start = await rectOf(page, '.window-product')
    await drag(page, { x: start.right - 2, y: start.bottom - 2 }, { x: start.right + 78, y: start.bottom + 38 })
    const larger = await rectOf(page, '.window-product')
    expect(Math.round(larger.w - start.w)).toBe(80)
    expect(Math.round(larger.h - start.h)).toBe(40)

    await drag(page, { x: larger.x + 2, y: larger.y + 2 }, { x: larger.x + 900, y: larger.y + 900 })
    const smallest = await rectOf(page, '.window-product')
    expect(Math.round(smallest.w)).toBe(520)
    expect(Math.round(smallest.h)).toBe(400)

    const overflow = await page.locator('.window-product .product-body').evaluate(
      (node) => node.scrollWidth - node.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('maximise and double click toggle between filling the desktop and the previous size', async ({ page }) => {
    await page.goto('/#stake-active')
    await settle(page, '.window-portal')
    const start = await rectOf(page, '.window-portal')
    await page.getByRole('button', { name: 'Maximise' }).click()
    const full = await settledRect(page, '.window-portal')
    const dock = await rectOf(page, '.dock-tray')
    expect(Math.round(full.x)).toBe(12)
    expect(Math.round(full.w)).toBe(1440 - 24)
    expect(Math.round(full.bottom)).toBe(Math.round(dock.y - 12))
    await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible()

    await page.locator('.window-portal .window-title').dblclick({ position: { x: 300, y: 20 } })
    const back = await settledRect(page, '.window-portal')
    expect(Math.round(back.w)).toBe(Math.round(start.w))
    expect(Math.round(back.x)).toBe(Math.round(start.x))
  })

  test('Stake content reflows at its minimum size without sideways scrolling', async ({ page }) => {
    await page.goto('/#stake-active')
    await settle(page, '.window-portal')
    const start = await rectOf(page, '.window-portal')
    await drag(page, { x: start.right - 2, y: start.bottom - 2 }, { x: start.x + 100, y: start.y + 100 })
    const size = await rectOf(page, '.window-portal')
    expect(Math.round(size.w)).toBe(760)
    expect(Math.round(size.h)).toBe(520)
    for (const hash of ['stake-active', 'stake-positions', 'stake-history']) {
      await page.evaluate((next) => (window.location.hash = next), hash)
      await page.waitForTimeout(150)
      const overflow = await page.locator('.portal-body').evaluate((node) => node.scrollWidth - node.clientWidth)
      expect(overflow, hash).toBeLessThanOrEqual(0)
    }
  })

  test('size and position are remembered while open and reset on reload', async ({ page }) => {
    await page.goto('/#workspace')
    await page.locator('[data-dock="propr"]').click()
    await settle(page, '.window-product')
    const start = await rectOf(page, '.window-product')
    await drag(page, { x: start.x + 60, y: start.y + 20 }, { x: start.x + 160, y: start.y + 20 })
    await page.getByRole('button', { name: 'Close' }).click()
    await page.locator('[data-dock="propr"]').click()
    await settle(page, '.window-product')
    expect(Math.round((await rectOf(page, '.window-product')).x)).toBe(Math.round(start.x + 100))

    await page.reload()
    await settle(page, '.window-product')
    expect(Math.round((await rectOf(page, '.window-product')).x)).toBe(Math.round(start.x))
  })

  test('below 900px windows are sheets with no handles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#propr')
    await expect(page.locator('.window-resize')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Maximise' })).toHaveCount(0)
  })
})

test.describe('chat', () => {
  test('a product name in a message opens that product', async ({ page }) => {
    await page.goto('/#workspace')
    await page.locator('.beat').first().getByRole('button', { name: 'FanBase' }).click()
    await expect(page).toHaveURL(/#fanbase/)
    await expect(page.getByRole('dialog', { name: 'FANBASE' })).toBeVisible()
  })

  test('bubbles fit their text within the width limits', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900, limit: 0.75 },
      { width: 390, height: 844, limit: 0.85 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/#workspace')
      const widths = await page.locator('.bubble').evaluateAll((nodes) => {
        const body = document.querySelector('.window-xborg .window-body') as HTMLElement
        return nodes.map((node) => node.getBoundingClientRect().width / body.clientWidth)
      })
      expect(Math.max(...widths)).toBeLessThanOrEqual(viewport.limit)
      // Short messages stay short rather than filling a fixed block.
      if (viewport.width > 900) expect(Math.min(...widths)).toBeLessThan(0.45)
    }
  })

  test('the end of the conversation leaves less than half of the chat empty', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/#workspace')
    const body = page.locator('.window-xborg .window-body')
    await body.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: 'instant' }))
    await page.waitForTimeout(700)
    const empty = await body.evaluate((node) => {
      const panel = node.querySelector('.portal-panel') as HTMLElement
      const bodyRect = node.getBoundingClientRect()
      return (bodyRect.bottom - panel.getBoundingClientRect().bottom) / bodyRect.height
    })
    expect(empty).toBeLessThan(0.5)
  })
})

test.describe('focus', () => {
  test('keyboard focus shows a ring, pointer focus does not', async ({ page }) => {
    await page.goto('/#workspace')
    await page.locator('[data-dock="propr"]').click()
    const close = page.getByRole('button', { name: 'Close' })
    const pointer = await close.evaluate((node) => {
      const style = getComputedStyle(node)
      return { focused: document.activeElement === node, outline: style.outlineStyle, shadow: style.boxShadow }
    })
    expect(pointer).toEqual({ focused: true, outline: 'none', shadow: 'none' })
    await page.keyboard.press('Shift+Tab')
    const keyboard = await page.evaluate(() => getComputedStyle(document.activeElement as HTMLElement).outlineStyle)
    expect(keyboard).toBe('solid')
  })

  test('closing a window returns focus to its dock tile', async ({ page }) => {
    await page.goto('/#workspace')
    await page.locator('[data-dock="trigr"]').click()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('[data-dock="trigr"]')).toBeFocused()
    await expect(page.locator('[data-dock="trigr"]')).toHaveCSS('outline-style', 'none')
  })
})
