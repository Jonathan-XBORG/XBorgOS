import { expect, test } from '@playwright/test'

const prohibitedControlColours = [
  'rgb(255, 59, 48)',
  'rgb(255, 189, 46)',
  'rgb(40, 205, 65)',
]

test('first beat is fully visible immediately and does not animate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#workspace')
  await page.waitForTimeout(100)

  const state = await page.locator('.beat').first().evaluate((beat) => {
    const body = beat.closest('.window-body') as HTMLElement
    const beatRect = beat.getBoundingClientRect()
    const bodyRect = body.getBoundingClientRect()
    const bubbles = [...beat.querySelectorAll('.bubble')]
    return {
      labelOpacity: getComputedStyle(beat.querySelector('.beat-label') as HTMLElement).opacity,
      bubbleOpacity: bubbles.map((bubble) => getComputedStyle(bubble).opacity),
      running: bubbles.flatMap((bubble) => bubble.getAnimations()).filter((animation) => animation.playState === 'running').length,
      top: beatRect.top,
      bottom: beatRect.bottom,
      bodyTop: bodyRect.top,
      bodyBottom: bodyRect.bottom,
      secondBeatOpacity: [
        ...[...beat.parentElement!.querySelectorAll('.beat')][1].querySelectorAll('.bubble'),
      ].map((bubble) => getComputedStyle(bubble).opacity),
    }
  })

  expect(state.labelOpacity).toBe('1')
  expect(state.bubbleOpacity).toEqual(['1', '1', '1', '1', '1'])
  expect(state.running).toBe(0)
  expect(state.top).toBeGreaterThanOrEqual(state.bodyTop)
  expect(state.bottom).toBeLessThanOrEqual(state.bodyBottom)
  expect(state.secondBeatOpacity).toEqual(['0', '0'])
})

test('dock starts idle and only an open product has a running indicator', async ({ page }) => {
  await page.goto('/#workspace')
  await expect(page.locator('.dock [aria-current]')).toHaveCount(0)
  await expect(page.locator('.dock-dot')).toHaveCount(0)

  await page.locator('[data-dock="propr"]').click()
  await expect(page.locator('[data-dock="propr"]')).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('.dock-dot')).toHaveCount(1)
})

test('Stake opens from the dock inside the desktop and preserves chat position on close', async ({ page }) => {
  await page.goto('/#workspace')
  const body = page.locator('.window-xborg .window-body')
  await body.evaluate((node) => node.scrollTo({ top: 260, behavior: 'instant' }))
  const before = await body.evaluate((node) => node.scrollTop)
  const trigger = page.locator('[data-dock="stake"]')
  await trigger.focus()
  await trigger.press('Enter')

  await expect(page).toHaveURL(/#stake-entry/)
  await expect(page.locator('.workspace')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'STAKE' })).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('.dock-dot')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'STAKE' })).toHaveCount(0)
  await expect(page).toHaveURL(/#workspace/)
  await expect(trigger).toBeFocused()
  await expect(body).toHaveJSProperty('scrollTop', before)
})

test('direct Stake hashes keep the desktop shell mounted', async ({ page }) => {
  await page.goto('/#stake-pledge-amount')
  await expect(page.locator('.workspace')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'STAKE' })).toBeVisible()
  await expect(page.locator('.window-portal .portal-app')).toBeVisible()
  await expect(page.locator('[data-dock="stake"]')).toHaveAttribute('aria-current', 'true')
})

test('Portal window stays between the desktop menu bar and dock', async ({ page }) => {
  await page.goto('/#stake-active')
  const bounds = await page.evaluate(() => {
    const menu = document.querySelector('.topbar') as HTMLElement
    const dialog = document.querySelector('.window-portal') as HTMLElement
    const dock = document.querySelector('.dock') as HTMLElement
    const menuRect = menu.getBoundingClientRect()
    const dialogRect = dialog.getBoundingClientRect()
    const dockRect = dock.getBoundingClientRect()
    return {
      menuBottom: menuRect.bottom,
      dialogTop: dialogRect.top,
      dialogBottom: dialogRect.bottom,
      dockTop: dockRect.top,
    }
  })
  expect(bounds.dialogTop - bounds.menuBottom).toBeGreaterThanOrEqual(24)
  expect(bounds.dockTop - bounds.dialogBottom).toBeGreaterThanOrEqual(16)
  await expect(page.locator('.window-portal main')).toHaveCount(1)
  await expect(page.locator('.portal-tabs [aria-current="page"]')).toHaveCount(1)
})

test('Portal desktop stage uses the taller image free geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#stake-active')
  await expect
    .poll(() => page.locator('.window-portal').evaluate((node) => node.getBoundingClientRect().height))
    .toBe(720)

  const stage = await page.evaluate(() => {
    const workspace = document.querySelector('.workspace') as HTMLElement
    const menu = document.querySelector('.topbar') as HTMLElement
    const portal = document.querySelector('.window-portal') as HTMLElement
    const dock = document.querySelector('.dock') as HTMLElement
    const workspaceStyle = getComputedStyle(workspace)
    const overlayStyle = getComputedStyle(workspace, '::after')
    const menuRect = menu.getBoundingClientRect()
    const portalRect = portal.getBoundingClientRect()
    const dockRect = dock.getBoundingClientRect()
    return {
      height: portalRect.height,
      menuClearance: portalRect.top - menuRect.bottom,
      dockClearance: dockRect.top - portalRect.bottom,
      pictures: workspace.querySelectorAll('picture').length,
      backgroundImages: [workspaceStyle.backgroundImage, overlayStyle.backgroundImage],
    }
  })

  expect(stage.height).toBe(720)
  expect(stage.menuClearance).toBeGreaterThanOrEqual(24)
  expect(stage.dockClearance).toBeGreaterThanOrEqual(16)
  expect(stage.pictures).toBe(0)
  // The wallpaper is generated. No photograph, which previously carried third party logos.
  expect(stage.backgroundImages.join(' ')).not.toMatch(/\.(jpe?g|png|webp)/)
})

test('Portal window becomes a full-screen app on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#stake-active')
  await page.waitForTimeout(350)
  const bounds = await page.locator('.window-portal').evaluate((node) => {
    const rect = node.getBoundingClientRect()
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
  })
  expect(bounds).toEqual({ left: 0, top: 0, width: 390, height: 844 })
})

test('Portal uses restrained scale motion when opened from the mobile dock', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#workspace')
  const scale = await page.locator('[data-dock="stake"]').evaluate(async (button) => {
    ;(button as HTMLButtonElement).click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const dialog = document.querySelector('.window-portal') as HTMLElement
    return new DOMMatrixReadOnly(getComputedStyle(dialog).transform).a
  })
  expect(scale).toBeGreaterThanOrEqual(0.9)
  expect(scale).toBeLessThan(1)
})

test('later bubbles reveal with a stagger and stay visible after scrolling back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#workspace')
  const body = page.locator('.window-body')
  const secondBeatBubbles = page.locator('.beat').nth(1).locator('.bubble')

  await body.evaluate((node) => node.scrollBy({ top: node.clientHeight, behavior: 'instant' }))
  await page.waitForTimeout(120)
  const during = await secondBeatBubbles.evaluateAll((nodes) =>
    nodes.map((node) => Number(getComputedStyle(node).opacity)),
  )
  expect(during[0]).toBeGreaterThan(during[1])

  await page.waitForTimeout(700)
  await expect(secondBeatBubbles.first()).toHaveCSS('opacity', '1')
  await expect(secondBeatBubbles.last()).toHaveCSS('opacity', '1')
  await body.evaluate((node) => node.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(100)
  await expect(secondBeatBubbles.first()).toHaveCSS('opacity', '1')
  await expect(secondBeatBubbles.last()).toHaveCSS('opacity', '1')
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
]) {
  test(`page never scrolls at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#workspace')
    const pageMetrics = await page.evaluate(() => ({
      height: document.scrollingElement?.scrollHeight,
      innerHeight: window.innerHeight,
      overflow: getComputedStyle(document.body).overflow,
    }))
    expect(pageMetrics.height).toBe(pageMetrics.innerHeight)
    expect(pageMetrics.overflow).toMatch(/hidden/)
  })
}

test('dock and Stake controls remain inside a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/#workspace')
  const dockBounds = await page.locator('.dock').evaluate((node) => {
    const rect = node.getBoundingClientRect()
    return { left: rect.left, right: rect.right }
  })
  expect(dockBounds.left).toBeGreaterThanOrEqual(0)
  expect(dockBounds.right).toBeLessThanOrEqual(320)

  await page.locator('[data-dock="stake"]').click()
  await expect(page.getByRole('button', { name: 'Close' })).toBeInViewport()
  const overflow = await page.evaluate(() => ({
    width: document.scrollingElement?.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(overflow.width).toBe(overflow.innerWidth)
})

test('menu bar gains blur and a hairline after 40px of conversation scroll', async ({ page }) => {
  await page.goto('/#workspace')
  await page.locator('.window-body').evaluate((node) => node.scrollTo({ top: 41, behavior: 'instant' }))
  await expect(page.locator('.topbar')).toHaveAttribute('data-scrolled', 'true')
  await page.waitForTimeout(450)
  const style = await page.locator('.topbar').evaluate((node) => {
    const computed = getComputedStyle(node)
    return {
      blur: computed.backdropFilter || computed.webkitBackdropFilter,
      border: computed.borderBottomWidth,
      borderColour: computed.borderBottomColor,
    }
  })
  expect(style.blur).toContain('blur(')
  expect(style.border).toBe('1px')
  expect(style.borderColour).not.toBe('rgba(0, 0, 0, 0)')
})

test('desktop header gives the brand and wallet action room to breathe', async ({ page }) => {
  await page.goto('/#workspace')
  await expect(page.locator('.topbar')).toHaveCSS('height', '44px')
  await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible()
  await expect(page.locator('.topbar').getByRole('button', { name: 'Open Stake' })).toHaveCount(0)
})

test('menu bar Connect Wallet opens Stake at its visitor view and resets on reload', async ({ page }) => {
  await page.goto('/#workspace')
  await page.locator('.topbar').getByRole('button', { name: 'Connect Wallet' }).click()

  await expect(page).toHaveURL(/#stake-entry/)
  await expect(page.getByRole('dialog', { name: 'STAKE' })).toBeVisible()
  await page.locator('.portal-entry-content').getByRole('button', { name: 'Connect Wallet' }).click()
  await expect(page.locator('.topbar').getByRole('button', { name: 'Wallet 0x8f2a…c41d' })).toBeVisible()

  await page.reload()
  await expect(page.locator('.topbar').getByRole('button', { name: 'Wallet 0x8f2a…c41d' })).toBeVisible()
  await page.goto('/#workspace')
  await page.reload()
  await expect(page.locator('.topbar').getByRole('button', { name: 'Connect Wallet' })).toBeVisible()
})

test('connected wallet state stays out of the mobile header after resize', async ({ page }) => {
  await page.goto('/#stake-active')
  await page.getByRole('button', { name: 'Close' }).click()
  const wallet = page.locator('.topbar').getByRole('button', { name: 'Wallet 0x8f2a…c41d' })
  await expect(wallet).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(wallet).toBeHidden()
})

test('desktop menu bar names XBorg, then the app in front', async ({ page }) => {
  await page.goto('/#workspace')
  await expect(page.locator('.topbar-app')).toHaveText('XBorg')
  await expect(page.locator('.topbar-brand .topbar-label')).toHaveCount(0)
  await page.locator('[data-dock="stake"]').click()
  await expect(page.locator('.topbar-app')).toHaveText('Stake')
  await expect(page.locator('.topbar-brand').getByRole('img', { name: 'XBorg' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.topbar-app')).toHaveText('XBorg')
})

test('dock uses the supplied product, social, and Portal artwork', async ({ page }) => {
  await page.goto('/#workspace')
  const mappings = [
    ['propr', '/icons/propr.svg'],
    ['fanbase', '/icons/fanbase.svg'],
    ['trigr', '/icons/trigr.svg'],
  ] as const

  for (const [id, src] of mappings) {
    const artwork = page.locator(`[data-dock="${id}"] img`)
    await expect(artwork).toHaveAttribute('src', src)
    await expect.poll(() => artwork.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }

  const socialMappings = [
    ['XBorg on X', '/icons/twitter.png'],
    ['XBorg Discord', '/icons/discord.png'],
  ] as const

  for (const [label, src] of socialMappings) {
    const artwork = page.getByRole('link', { name: label }).locator('img')
    await expect(artwork).toHaveAttribute('src', src)
    await expect.poll(() => artwork.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }

  const portalMark = page.locator('[data-dock="stake"] .xborg-favicon svg')
  await expect(portalMark).toBeVisible()
  await expect(portalMark).toHaveAttribute('viewBox', '0 0 19 20')
  await expect(portalMark.locator('path')).toHaveCount(2)

  await expect(page.locator('[data-product="propr"] .product-tile-icon img')).toHaveAttribute('src', '/icons/propr.svg')
  await page.locator('[data-dock="fanbase"]').click()
  await expect(page.locator('.product-mark img')).toHaveAttribute('src', '/icons/fanbase.svg')
})

test('desktop controls use one short interaction duration', async ({ page }) => {
  await page.goto('/#workspace')
  const durations = await page.evaluate(() => {
    const read = (selector: string) =>
      getComputedStyle(document.querySelector(selector) as HTMLElement)
        .transitionDuration.split(',')
        .map((value) => Number.parseFloat(value) * (value.includes('ms') ? 1 : 1000))
    return {
      button: read('.topbar .btn'),
      dock: read('[data-dock="propr"]'),
    }
  })
  expect(Math.max(...durations.button)).toBeLessThanOrEqual(180)
  expect(Math.max(...durations.dock)).toBeLessThanOrEqual(180)
})

test('window controls use neutral XBorg chrome and no system furniture appears', async ({ page }) => {
  await page.goto('/#propr')
  await expect(page.locator('.window-product .window-controls')).toBeVisible()
  await expect(page.getByText(/\b\d{1,2}:\d{2}\b/)).toHaveCount(0)
  await expect(page.locator('[aria-label*="Apple" i]')).toHaveCount(0)
  const colours = await page.locator('.window-control').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).backgroundColor),
  )
  for (const colour of colours) expect(prohibitedControlColours).not.toContain(colour)
})

test('desktop dock magnifies and shows a tooltip on hover', async ({ page }) => {
  await page.goto('/#workspace')
  const propr = page.locator('[data-dock="propr"]')
  const fanbase = page.locator('[data-dock="fanbase"]')
  const icon = propr.locator('.dock-icon')
  const before = await icon.evaluate((node) => node.getBoundingClientRect().height)
  await propr.hover()
  await page.waitForTimeout(400)
  const state = await Promise.all([
    icon.evaluate((node) => ({ height: node.getBoundingClientRect().height, transform: getComputedStyle(node).transform })),
    fanbase.evaluate((node) => getComputedStyle(node).transform),
    propr.locator('.dock-label').evaluate((node) => {
      const rect = node.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return {
        opacity: getComputedStyle(node).opacity,
        hit: hit === node || node.contains(hit),
      }
    }),
  ])
  expect(state[0].height).toBeGreaterThan(before)
  expect(state[0].transform).not.toBe('none')
  // Only the icons move. The buttons, and so the dock's layout, never shift.
  expect(state[1]).toBe('none')
  expect(state[2]).toEqual({ opacity: '1', hit: true })
})

test('product window scales from its dock tile', async ({ page }) => {
  await page.goto('/#workspace')
  const tile = page.locator('[data-dock="propr"]')
  await tile.click()
  await page.mouse.move(12, 96)
  await page.waitForTimeout(450)

  const origin = await page.locator('.window-product').evaluate((node) => {
    const win = node as HTMLElement
    const dock = document.querySelector('[data-dock="propr"]') as HTMLElement
    const winRect = win.getBoundingClientRect()
    const dockRect = dock.getBoundingClientRect()
    const [originX, originY] = getComputedStyle(win).transformOrigin
      .split(' ')
      .map((value) => Number.parseFloat(value))
    return {
      sourceX: winRect.left + originX,
      sourceY: winRect.top + originY,
      targetX: dockRect.left + dockRect.width / 2,
      targetY: dockRect.top + dockRect.height / 2,
    }
  })

  expect(Math.abs(origin.sourceX - origin.targetX)).toBeLessThan(8)
  expect(Math.abs(origin.sourceY - origin.targetY)).toBeLessThan(8)
})

test('Portal window scales from its dock tile', async ({ page }) => {
  await page.goto('/#workspace')
  const tile = page.locator('[data-dock="stake"]')
  await tile.click()
  await page.mouse.move(12, 96)
  await page.waitForTimeout(350)

  const origin = await page.locator('.window-portal').evaluate((node) => {
    const win = node as HTMLElement
    const dock = document.querySelector('[data-dock="stake"]') as HTMLElement
    const winRect = win.getBoundingClientRect()
    const dockRect = dock.getBoundingClientRect()
    const [originX, originY] = getComputedStyle(win).transformOrigin
      .split(' ')
      .map((value) => Number.parseFloat(value))
    return {
      sourceX: winRect.left + originX,
      sourceY: winRect.top + originY,
      targetX: dockRect.left + dockRect.width / 2,
      targetY: dockRect.top + dockRect.height / 2,
    }
  })

  expect(Math.abs(origin.sourceX - origin.targetX)).toBeLessThan(8)
  expect(Math.abs(origin.sourceY - origin.targetY)).toBeLessThan(8)
})

test('product window visibly scales on open and close', async ({ page }) => {
  await page.goto('/#workspace')
  const openingScale = await page.locator('[data-dock="propr"]').evaluate(async (button) => {
    ;(button as HTMLButtonElement).click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const window = document.querySelector('.window-product') as HTMLElement
    return new DOMMatrixReadOnly(getComputedStyle(window).transform).a
  })
  expect(openingScale).toBeGreaterThanOrEqual(0.9)
  expect(openingScale).toBeLessThan(1)

  await page.waitForTimeout(450)
  const closingScale = await page.getByRole('button', { name: 'Close' }).evaluate(async (button) => {
    ;(button as HTMLButtonElement).click()
    for (let frame = 0; frame < 4; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    const window = document.querySelector('.window-product') as HTMLElement
    return new DOMMatrixReadOnly(getComputedStyle(window).transform).a
  })
  expect(closingScale).toBeGreaterThanOrEqual(0.94)
  expect(closingScale).toBeLessThan(1)
})

test('dock focus magnifies and exposes its label with a coarse pointer', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1024, height: 768 },
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5174/#workspace')
  const propr = page.locator('[data-dock="propr"]')
  await page.keyboard.press('Tab')
  await propr.focus()
  await page.waitForTimeout(320)
  const state = await propr.evaluate((node) => ({
    transform: getComputedStyle(node).transform,
    labelOpacity: getComputedStyle(node.querySelector('.dock-label') as HTMLElement).opacity,
  }))
  expect(state.transform).not.toBe('none')
  expect(state.labelOpacity).toBe('1')
  await context.close()
})

test('mobile keeps the desktop menu bar treatment out of the opening screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#workspace')
  const topbar = await page.locator('.topbar').evaluate((node) => {
    const rect = node.getBoundingClientRect()
    const style = getComputedStyle(node)
    return { height: rect.height, background: style.backgroundColor, border: style.borderBottomWidth }
  })
  expect(topbar.height).toBeLessThanOrEqual(2)
  expect(topbar.background).toBe('rgba(0, 0, 0, 0)')
  expect(topbar.border).toBe('0px')
})
