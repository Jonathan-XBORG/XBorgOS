import { test } from '@playwright/test'

test.use({
  video: { mode: 'on', size: { width: 1440, height: 900 } },
})

test('scroll recording', async ({ page }) => {
  await page.goto('/#workspace')
  await page.mouse.move(80, 240)
  for (let i = 0; i < 8; i += 1) {
    await page.mouse.wheel(0, 180)
    await page.waitForTimeout(220)
  }
})
