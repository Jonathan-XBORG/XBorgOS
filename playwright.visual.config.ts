import { defineConfig, devices } from '@playwright/test'

// Pixel comparison used while refactoring styles. Not part of the main suite.
export default defineConfig({
  testDir: './tests-visual',
  fullyParallel: true,
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{ext}',
  use: { baseURL: 'http://127.0.0.1:5174', browserName: 'chromium' },
  expect: { toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled', caret: 'hide' } },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'visual', use: { ...devices['Desktop Chrome'] } }],
})
