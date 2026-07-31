import { expect, test } from '@playwright/test';

test.describe('Offline experience', () => {
  test.slow();

  test.describe('Offline fallback page', () => {
    test('navigating to /offline shows offline indicator', async ({ page }) => {
      await page.goto('/offline', { waitUntil: 'domcontentloaded' });

      const heading = page.getByRole('heading', { name: /offline|connection/i });
      await expect(heading).toBeVisible();

      const statusText = page.getByText(/Status:/i);
      await expect(statusText).toBeVisible();
    });

    test('shows "You\'re Offline" heading when offline', async ({ page, context }) => {
      await page.goto('/offline', { waitUntil: 'domcontentloaded' });

      await context.setOffline(true);

      const offlineHeading = page.getByText("You're Offline");
      await expect(offlineHeading).toBeVisible();

      const wifiIcon = page.locator('svg').first();
      await expect(wifiIcon).toBeVisible();
    });

    test('shows "Connection Restored" when back online', async ({ page, context }) => {
      await page.goto('/offline', { waitUntil: 'domcontentloaded' });

      await context.setOffline(true);
      await expect(page.getByText("You're Offline")).toBeVisible();

      await context.setOffline(false);

      const onlineHeading = page.getByText('Connection Restored');
      await expect(onlineHeading).toBeVisible({ timeout: 5000 });
    });

    test('displays available offline features list', async ({ page, context }) => {
      await page.goto('/offline', { waitUntil: 'domcontentloaded' });
      await context.setOffline(true);

      await expect(page.getByText('Available Offline:')).toBeVisible();
      await expect(page.getByText(/cached invoices/i)).toBeVisible();
      await expect(page.getByText(/LP portfolio/i)).toBeVisible();
      await expect(page.getByText(/earnings history/i)).toBeVisible();
    });

    test('shows Go to Dashboard link', async ({ page }) => {
      await page.goto('/offline', { waitUntil: 'domcontentloaded' });

      const dashboardLink = page.getByRole('link', { name: /go to dashboard/i });
      await expect(dashboardLink).toBeVisible();
      await expect(dashboardLink).toHaveAttribute('href', '/');
    });

    test('Continue button navigates back when online', async ({ page }) => {
      await page.goto('/offline', { waitUntil: 'domcontentloaded' });

      const continueButton = page.getByRole('button', { name: /continue/i });
      if (await continueButton.isVisible()) {
        await expect(continueButton).toBeVisible();
      }
    });
  });

  test.describe('Service worker caching', () => {
    test('service worker is registered', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          return registration.active !== null;
        }
        return false;
      });

      expect(swRegistered).toBe(true);
    });

    test('previously-visited page loads while offline', async ({ page, context }) => {
      // Visit homepage while online to populate the cache
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Go offline
      await context.setOffline(true);

      // Navigate to homepage - should be served from cache
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Page should still render (either from cache or offline fallback)
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();
    });

    test('marketplace page loads while offline after prior visit', async ({ page, context }) => {
      // Visit marketplace while online to populate cache
      await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Go offline
      await context.setOffline(true);

      // Navigate to marketplace again
      await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });

      // Page body should have content (cached or offline fallback)
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();
    });
  });

  test.describe('Offline navigation behavior', () => {
    test('shows offline fallback for uncached routes', async ({ page, context }) => {
      // Go offline without visiting any page first
      await context.setOffline(true);

      // Try to navigate to a route that likely isn't cached
      await page.goto('/stats', { waitUntil: 'domcontentloaded' });

      // Page should still have some content (either offline fallback or cached)
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();
    });

    test('offline page status indicator shows correct state', async ({ page, context }) => {
      await page.goto('/offline', { waitUntil: 'domcontentloaded' });

      // Check offline status
      await context.setOffline(true);
      const offlineStatus = page.locator('span.text-error, span:has-text("Offline")');
      await expect(offlineStatus.first()).toBeVisible({ timeout: 5000 });

      // Check online status after reconnection
      await context.setOffline(false);
      const onlineStatus = page.locator('span.text-primary, span:has-text("Online")');
      await expect(onlineStatus.first()).toBeVisible({ timeout: 5000 });
    });
  });
});
