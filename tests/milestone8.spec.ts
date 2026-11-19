import { expect, test, type Page } from '@playwright/test'
import { SCREENS } from '../src/screens'

// Walks the page with Tab and records what each stop looks like.
async function tabWalk(page: Page, stops: number) {
  const seen: { name: string; ring: boolean; clipped: boolean; onScreen: boolean }[] = []
  for (let i = 0; i < stops; i += 1) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const style = getComputedStyle(el)
      const width = parseFloat(style.outlineWidth)
      const offset = parseFloat(style.outlineOffset)
      const colour = style.outlineColor
      const ring = style.outlineStyle !== 'none' && width >= 2 && !/rgba\(.*, 0\)$/.test(colour)
      const rect = el.getBoundingClientRect()
      const pad = Math.max(0, offset) + width
      const outer = { left: rect.left - pad, top: rect.top - pad, right: rect.right + pad, bottom: rect.bottom + pad }
      // A ring drawn inside the element, with a negative offset, is never clipped by ancestors.
      let clipped = false
      if (offset >= 0) {
        for (let node = el.parentElement; node; node = node.parentElement) {
          const s = getComputedStyle(node)
          if (!/(hidden|auto|scroll|clip)/.test(`${s.overflowX} ${s.overflowY}`)) continue
          const box = node.getBoundingClientRect()
          if (outer.left < box.left - 0.5 || outer.right > box.right + 0.5 || outer.top < box.top - 0.5 || outer.bottom > box.bottom + 0.5) {
            // Scroll containers clip only what lies outside their visible box, and the ring may simply be scrolled.
            if (/(auto|scroll)/.test(`${s.overflowX} ${s.overflowY}`) && (rect.top < box.top || rect.bottom > box.bottom)) continue
            clipped = true
            break
          }
        }
      }
      const name = el.getAttribute('aria-label') || el.getAttribute('data-dock') || el.textContent?.trim().slice(0, 40) || el.className
      return {
        name,
        ring,
        clipped,
        onScreen: rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth,
      }
    })
    if (stop) seen.push(stop)
  }
  return seen
}

test.describe('keyboard pass', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('the desktop reaches every control and every stop shows an unclipped ring', async ({ page }) => {
    await page.goto('/?present=1#workspace')
    await page.waitForTimeout(400)
    // Start from the top of the document rather than the focused chat window.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    const stops = await tabWalk(page, 26)
    const names = stops.map((s) => s.name)
    for (const expected of ['Connect Wallet', 'Propr', 'FanBase', 'Trigr', 'Stake', 'Earn', 'XBorg on X', 'XBorg Discord']) {
      expect(names, expected).toContain(expected)
    }
    for (const stop of stops) {
      if (stop.name === '') continue
      expect(stop.ring, `${stop.name} ring`).toBe(true)
      expect(stop.clipped, `${stop.name} clipped`).toBe(false)
    }
  })

  test('Stake reaches its controls and keeps focus inside the window', async ({ page }) => {
    await page.goto('/?present=1#stake-active')
    await page.waitForTimeout(500)
    const stops = await tabWalk(page, 30)
    const names = stops.map((s) => s.name)
    for (const expected of ['Maximise', 'Close', 'Rewards', 'Positions', 'History', 'Reset Demo State', 'Pledge more', 'See all boosts', 'View leaderboard']) {
      expect(names, expected).toContain(expected)
    }
    for (const stop of stops) {
      expect(stop.ring, `${stop.name} ring`).toBe(true)
      expect(stop.clipped, `${stop.name} clipped`).toBe(false)
    }
  })

  test('the verify flow can be completed from the keyboard alone', async ({ page }) => {
    await page.goto('/?present=1#stake-not-verified')
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: 'Verify' }).first().focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Verify your wallet' })
    await expect(dialog.getByLabel('Email')).toBeFocused()
    await page.keyboard.type('trader@example.com')
    await page.keyboard.press('Enter')
    await expect(dialog.getByRole('button', { name: 'Sign', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    const wallet = dialog.getByRole('region', { name: 'Demo wallet: Signature request' })
    await expect(wallet.getByRole('button', { name: 'Sign' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(dialog.getByText('Email linked to your wallet.')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeFocused()
  })

  test('the wallet menu is reachable and closes back to its trigger', async ({ page }) => {
    await page.goto('/?present=1#stake-active')
    await page.getByRole('button', { name: 'Close' }).click()
    const trigger = page.locator('.topbar .wallet-control')
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitem', { name: 'Open Stake' })).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.getByRole('menuitem', { name: 'Disconnect' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })
})

test.describe('reduced motion pass', () => {
  test.use({ viewport: { width: 1440, height: 900 } })
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('windows appear without scaling and glide nowhere', async ({ page }) => {
    await page.goto('/#workspace')
    const scale = await page.locator('[data-dock="propr"]').evaluate(async (button) => {
      ;(button as HTMLButtonElement).click()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const win = document.querySelector('.window-product') as HTMLElement
      return { transform: getComputedStyle(win).transform, transition: getComputedStyle(win).transitionDuration }
    })
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(scale.transform)
    expect(scale.transition.split(',').every((d) => parseFloat(d) === 0)).toBe(true)
  })

  test('hover and press never move anything', async ({ page }) => {
    await page.goto('/#workspace')
    await page.locator('[data-dock="fanbase"]').hover()
    await page.waitForTimeout(100)
    await expect(page.locator('[data-dock="fanbase"]')).toHaveCSS('transform', 'none')
    await page.locator('.beat').nth(1).evaluate((node) => node.scrollIntoView())
    const tile = page.locator('.product-tile').first()
    await tile.hover()
    await expect(tile).toHaveCSS('transform', 'none')
  })

  test('the wallet menu opens without travel', async ({ page }) => {
    await page.goto('/#stake-active')
    await page.getByRole('button', { name: 'Close' }).click()
    await page.locator('.topbar .wallet-control').click()
    const menu = page.getByRole('menu', { name: 'Wallet' })
    await expect(menu).toBeVisible()
    const transform = await menu.evaluate((node) => getComputedStyle(node).transform)
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform)
  })

  test('every later message is visible at once', async ({ page }) => {
    await page.goto('/#workspace')
    const opacities = await page.locator('.bubble').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).opacity))
    expect(opacities.every((o) => o === '1')).toBe(true)
  })
})

test.describe('320px pass', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  for (const { id } of SCREENS) {
    test(`${id} fits 320px without sideways scrolling`, async ({ page }) => {
      await page.goto(`/#${id}`)
      await page.waitForTimeout(400)
      const result = await page.evaluate(() => {
        const scrollers = [...document.querySelectorAll<HTMLElement>('.window-body, .portal-body, .system, .portal-modal-body')]
        const sideways = scrollers
          .filter((node) => node.getClientRects().length)
          .map((node) => ({ name: node.className, overflow: node.scrollWidth - node.clientWidth }))
          .filter((entry) => entry.overflow > 0)
        return {
          pageFits: document.scrollingElement!.scrollWidth <= window.innerWidth && document.scrollingElement!.scrollHeight === window.innerHeight,
          sideways,
        }
      })
      expect(result.pageFits).toBe(true)
      expect(result.sideways).toEqual([])
    })
  }
})

test.describe('mobile overlaps', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  async function visibleRect(page: Page, selector: string) {
    return page.evaluate((sel) => {
      const node = document.querySelector(sel) as HTMLElement | null
      if (!node || !node.getClientRects().length) return null
      const rect = node.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      if (!hit || !(node === hit || node.contains(hit))) return null
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
    }, selector)
  }

  const overlaps = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

  for (const hash of ['workspace', 'stake-active', 'stake-positions', 'stake-history', 'propr']) {
    test(`${hash}: tab bar, dock and review bar never overlap`, async ({ page }) => {
      await page.goto(`/#${hash}`)
      await page.waitForTimeout(500)
      const rects = {
        tabbar: await visibleRect(page, '.portal-tabbar'),
        dock: await visibleRect(page, '.dock-tray'),
        review: await visibleRect(page, '.review'),
      }
      const present = Object.entries(rects).filter(([, r]) => r) as [string, NonNullable<(typeof rects)['dock']>][]
      for (let i = 0; i < present.length; i += 1) {
        for (let j = i + 1; j < present.length; j += 1) {
          expect(overlaps(present[i][1], present[j][1]), `${present[i][0]} and ${present[j][0]}`).toBe(false)
        }
      }
    })
  }
})

test.describe('product windows', () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ]) {
    test(`the visit action is in view without scrolling at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      for (const id of ['propr', 'fanbase', 'trigr']) {
        await page.goto('about:blank')
        await page.goto(`/#${id}`)
        await page.waitForTimeout(400)
        const inView = await page.evaluate(() => {
          const action = document.querySelector('.product-body .btn-primary')!.getBoundingClientRect()
          const body = document.querySelector('.product-body')!.getBoundingClientRect()
          return action.bottom <= body.bottom && action.top >= body.top
        })
        expect(inView, id).toBe(true)
      }
    })
  }
})
