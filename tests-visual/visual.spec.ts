import { expect, test, type Page } from '@playwright/test'
import { SCREENS } from '../src/screens'

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
]

async function ready(page: Page, hash: string) {
  await page.goto(`/#${hash}`)
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(2, 300)
  await page.waitForTimeout(650)
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}`, () => {
    test.use({ viewport })

    for (const { id } of SCREENS) {
      test(id, async ({ page }) => {
        await ready(page, id)
        await expect(page).toHaveScreenshot(`${viewport.width}-${id}.png`)
      })
    }

    test('chat end', async ({ page }) => {
      await ready(page, 'workspace')
      await page.locator('.window-xborg .window-body').evaluate((node) => {
        node.querySelectorAll('.bubble, .beat-label, .product-tile-wrap, .portal-panel').forEach((el) => {
          ;(el as HTMLElement).style.opacity = '1'
          ;(el as HTMLElement).style.transform = 'none'
        })
        node.scrollTop = node.scrollHeight
      })
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot(`${viewport.width}-chat-end.png`)
    })

    test('chat beat two', async ({ page }) => {
      await ready(page, 'workspace')
      await page.locator('.window-xborg .window-body').evaluate((node) => {
        node.querySelectorAll('.bubble, .beat-label, .product-tile-wrap, .portal-panel').forEach((el) => {
          ;(el as HTMLElement).style.opacity = '1'
          ;(el as HTMLElement).style.transform = 'none'
        })
        const beat = node.querySelectorAll('.beat')[1] as HTMLElement
        node.scrollTop = beat.offsetTop - 16
      })
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot(`${viewport.width}-chat-beat-2.png`)
    })
  })
}

test.describe('desktop states', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('wallet menu', async ({ page }) => {
    await ready(page, 'portal-home')
    await page.getByRole('button', { name: 'Close' }).click()
    await page.waitForTimeout(400)
    await page.locator('.topbar .wallet-control').click()
    await page.waitForTimeout(300)
    await expect(page).toHaveScreenshot('state-wallet-menu.png')
  })

  test('dock hover', async ({ page }) => {
    await ready(page, 'workspace')
    await page.locator('[data-dock="fanbase"]').hover()
    await page.waitForTimeout(300)
    await expect(page).toHaveScreenshot('state-dock-hover.png')
  })

  test('keyboard focus', async ({ page }) => {
    await ready(page, 'portal-home')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(100)
    await expect(page).toHaveScreenshot('state-keyboard-focus.png')
  })

  test('portal minimum', async ({ page }) => {
    await ready(page, 'portal-participate')
    const box = (await page.locator('.window-portal').boundingBox())!
    await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 100, box.y + 100, { steps: 6 })
    await page.mouse.up()
    await page.mouse.move(2, 300)
    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('state-portal-minimum.png')
  })

  test('stake modal', async ({ page }) => {
    await ready(page, 'portal-stake-preview')
    await expect(page).toHaveScreenshot('state-stake-modal.png')
  })
})
