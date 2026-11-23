import { expect, test, type Page, type Response } from '@playwright/test';
import {
  classifyRouteStatus,
  gotoWithRetry,
  routeExistsInSource,
  smokeRoutes,
  staleDeploymentMessage,
} from './support/testnet-smoke';

test.describe('Live testnet smoke checks', () => {
  for (const route of smokeRoutes) {
    test(`renders ${route.name} without crashing`, async ({ page }) => {
      const response = await gotoWithRetry(page, route.path);
      const status = response?.status();

      // A 404 for a route that still exists in this repo means the live deployment
      // predates it. That is a deployment problem, not an application regression:
      // skip with an actionable message instead of failing the nightly run (and
      // opening yet another duplicate issue). Routes that really were removed
      // still fail, so the route list cannot silently go stale.
      if (classifyRouteStatus(status, routeExistsInSource(route.path)) === 'stale-deployment') {
        test.skip(true, staleDeploymentMessage(route.path));
      }

      expect(
        status,
        `${route.path} returned HTTP ${status}; redeploy the testnet build if the route exists in the code`
      ).toBeLessThan(400);

      // `toBeVisible` polls until the timeout, unlike a one-shot isVisible()
      // probe: client-rendered content is not present at domcontentloaded.
      await expect(
        page.getByRole('main').first(),
        `${route.path} rendered no main content`
      ).toBeVisible({
        timeout: 20000,
      });

      // Keep the heading assertion honest. A body-length fallback would pass
      // on an error page with plenty of text and mask a real copy regression;
      // the auto-retrying assertion both waits for hydration and fails with a
      // useful message when the expected heading never appears.
      await expect(
        page.locator('h1, h2').filter({ hasText: route.headingPattern }).first(),
        `${route.path} did not render an expected heading`
      ).toBeVisible({ timeout: 15000 });
    });
  }
});
