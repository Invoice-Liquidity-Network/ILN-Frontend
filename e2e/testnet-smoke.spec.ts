import { expect, test } from '@playwright/test';

const smokeRoutes = [
  { name: 'home', path: '/', headingPattern: /invoice liquidity network|turn unpaid invoices|liquidity/i },
  { name: 'marketplace', path: '/marketplace', headingPattern: /invoice marketplace|marketplace|browse|invoices/i },
  { name: 'governance', path: '/governance', headingPattern: /governance|proposal/i },
  { name: 'stats', path: '/stats', headingPattern: /stats|protocol|analytics/i },
  {
    name: 'leaderboard',
    path: '/leaderboard',
    headingPattern: /leaderboard|ranking|top payers|top freelancers|top liquidity providers/i,
  },
  { name: 'analytics', path: '/analytics', headingPattern: /analytics|performance|stats/i },
];

// Helper for network resilience - handles both loading states and timeout errors
async function loadPageWithRetry(
  page: import('@playwright/test').Page,
  url: string,
  retries = 2
): Promise<import('@playwright/test').Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (response?.status() && response.status() >= 400) {
        throw new Error(`HTTP ${response.status()} loading ${url}`);
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await page.waitForTimeout(2000); // Wait before retry
    }
  }
  return null;
}

test.describe('Live testnet smoke checks', () => {
  for (const route of smokeRoutes) {
    test(`renders ${route.name} without crashing`, async ({ page }) => {
      await loadPageWithRetry(page, route.path);

      // Ensure main content area is visible before proceeding
      await expect(page.getByRole('main').first()).toBeVisible({ timeout: 30000 });

      // Verify page has substantial content (not just an error or loading state)
      const heading = page.locator('h1, h2').filter({ hasText: route.headingPattern }).first();
      const isHeadingVisible = await heading.isVisible({ timeout: 15000 }).catch(() => false);

      if (!isHeadingVisible) {
        // Fallback: check for meaningful content
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length ?? 0).toBeGreaterThan(100);
      }
    });
  }
});
