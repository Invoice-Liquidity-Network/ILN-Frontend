import { defineConfig, devices } from '@playwright/test';

const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const isRemoteBaseUrl = Boolean(
  configuredBaseUrl &&
    !configuredBaseUrl.includes('127.0.0.1') &&
    !configuredBaseUrl.includes('localhost')
);

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/playwright',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: configuredBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-375',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'mobile-390',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: isRemoteBaseUrl
    ? undefined
    : {
        // In CI, build+start a production server: next-pwa only injects a full
        // service worker precache manifest for production builds, and the
        // offline/PWA specs need that to get real signal. Locally, `pnpm dev`
        // is faster for iteration and doesn't affect those specs' assertions.
        command: process.env.CI ? 'pnpm build && pnpm start' : 'pnpm dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: process.env.CI ? 240_000 : 120_000,
        env: {
          NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING || 'enabled',
        },
      },
});
