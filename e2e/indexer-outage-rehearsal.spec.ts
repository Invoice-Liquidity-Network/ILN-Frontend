import { expect, test, type Page } from '@playwright/test';

/**
 * Production-build rehearsal for indexer outage, staleness, delay, and recovery
 * (Issue #1150, #1284). See docs/indexer-downtime.md for the documented fallback
 * matrix this spec rehearses against a real built app rather than a unit
 * test's mocked module boundary.
 *
 * Data sources & assumptions:
 * - Invoice header, balances, and lifecycle state on `/i/[id]` come from direct
 *   Stellar contract reads (`getInvoice` in `app/i/[id]/page.tsx`), not the indexer.
 * - `ActivityFeed` (`src/components/ActivityFeed.tsx`) reads exclusively from
 *   the same-origin indexer proxy (`/api/indexer/invoices/:id/events`) via
 *   `fetchInvoiceEvents` (`src/lib/indexer-client.ts`).
 * - When the indexer lags (`ageMs > staleAfterMs`) or omits timestamps
 *   (`lastIndexedAt: null`), `IndexerFreshnessBadge` (`data-freshness="stale"`
 *   or `"unknown"`) warns the user that data may be out of date rather than
 *   presenting stale indexer data as live/confirmed.
 * - When the indexer fails (5xx, 504 timeout, network abort, or malformed
 *   response), `ActivityFeed` renders `IndexerUnavailableNotice` (`role="alert"`)
 *   with a retry action and never fabricates audit events in production.
 * - `DefaultRateChart` and `FundingChart` are unit-tested, but nothing under
 *   `app/` currently mounts them, so this spec focuses on `/i/1` (`ActivityFeed`).
 *
 * `ActivityFeed` is mounted on `/i/[id]` (see `app/i/[id]/page.tsx`).
 * Invoice id 1 exists in the mock contract-read fixtures
 * (`src/mocks/fixtures/contract.ts`), so it resolves in CI without a live
 * contract deployment.
 */

const INVOICE_PATH = '/i/1';
const INDEXER_EVENTS_URL = '**/api/indexer/invoices/*/events';

function buildEventsEnvelope(options: {
  events?: Array<Record<string, unknown>>;
  lastIndexedLedger?: number | null;
  lastIndexedAt?: string | null;
  staleAfterMs?: number;
}) {
  return {
    ok: true,
    resource: 'invoice.events',
    data: options.events ?? [],
    meta: {
      apiVersion: 'v1',
      droppedRecords: 0,
      freshness: {
        lastIndexedLedger: options.lastIndexedLedger ?? 123456,
        lastIndexedAt: options.lastIndexedAt ?? new Date().toISOString(),
        staleAfterMs: options.staleAfterMs ?? 300_000,
      },
    },
  };
}

async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => {
      const nav = document.querySelector('nav');
      return nav && Object.keys(nav).some((k) => k.startsWith('__reactFiber'));
    },
    { timeout: 15000 }
  );
}

test.describe('Indexer outage journey rehearsal (production build)', () => {
  test.slow();

  test('unavailable: a 5xx from the indexer shows the honest unavailable notice, not fabricated events', async ({
    page,
  }) => {
    await page.route(INDEXER_EVENTS_URL, (route) =>
      route.fulfill({ status: 503, body: 'simulated indexer outage' })
    );

    await page.goto(INVOICE_PATH, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const notice = page.getByRole('alert').filter({ hasText: /temporarily unavailable/i });
    await expect(notice).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();

    // The honest-unavailable rule (docs/indexer-downtime.md): never show a
    // fabricated audit trail in place of a real failure.
    await expect(page.getByText(/Unknown actor/i)).toHaveCount(0);
  });

  test('network-level failure: an unreachable indexer also shows the unavailable notice', async ({
    page,
  }) => {
    await page.route(INDEXER_EVENTS_URL, (route) => route.abort('failed'));

    await page.goto(INVOICE_PATH, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const notice = page.getByRole('alert').filter({ hasText: /temporarily unavailable/i });
    await expect(notice).toBeVisible({ timeout: 20000 });
  });

  test('malformed response: a non-JSON 200 is treated as a failure, not parsed as events', async ({
    page,
  }) => {
    await page.route(INDEXER_EVENTS_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html>not json</html>' })
    );

    await page.goto(INVOICE_PATH, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const notice = page.getByRole('alert').filter({ hasText: /temporarily unavailable/i });
    await expect(notice).toBeVisible({ timeout: 20000 });
  });

  test('recovery: retrying after the indexer comes back shows real events, not a stuck notice', async ({
    page,
  }) => {
    let failing = true;
    await page.route(INDEXER_EVENTS_URL, (route) => {
      if (failing) {
        return route.fulfill({ status: 503, body: 'simulated indexer outage' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildEventsEnvelope({
            events: [
              {
                type: 'invoice_submitted',
                timestamp: Date.now() - 60_000,
                actor: 'GRECOVERYTESTACTORAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              },
            ],
          })
        ),
      });
    });

    await page.goto(INVOICE_PATH, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const notice = page.getByRole('alert').filter({ hasText: /temporarily unavailable/i });
    await expect(notice).toBeVisible({ timeout: 20000 });

    failing = false;
    await page.getByRole('button', { name: /try again/i }).click();

    await expect(notice).toBeHidden({ timeout: 20000 });
    await expect(page.getByText(/invoice submitted/i)).toBeVisible({ timeout: 10000 });
  });

  test('stale indexer: lagging freshness metadata shows out-of-date warning and does not present stale data as live', async ({
    page,
  }) => {
    const staleTimestamp = new Date(Date.now() - 20 * 60_000).toISOString();
    await page.route(INDEXER_EVENTS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildEventsEnvelope({
            lastIndexedLedger: 123456,
            lastIndexedAt: staleTimestamp,
            staleAfterMs: 300_000,
            events: [
              {
                type: 'invoice_funded',
                ledger: 123450,
                timestamp: Date.now() - 20 * 60_000,
                actor: 'GSTALETESTACTORAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                data: { amount: '100000000' },
              },
            ],
          })
        ),
      })
    );

    await page.goto(INVOICE_PATH, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const badge = page.locator('[data-freshness="stale"]');
    await expect(badge).toBeVisible({ timeout: 20000 });
    await expect(badge).toContainText(/data may be out of date/i);
    await expect(badge).toContainText(/ledger #123,456/i);

    // Must never present lagging indexer data as live/fresh.
    await expect(page.locator('[data-freshness="fresh"]')).toHaveCount(0);
    await expect(page.getByText(/updated just now/i)).toHaveCount(0);
    await expect(page.getByTestId('data-source-caption')).toBeVisible();
  });

  test('unknown freshness: missing lastIndexedAt surfaces unknown freshness rather than live', async ({
    page,
  }) => {
    await page.route(INDEXER_EVENTS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildEventsEnvelope({
            lastIndexedLedger: 123456,
            lastIndexedAt: null,
            events: [],
          })
        ),
      })
    );

    await page.goto(INVOICE_PATH, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const badge = page.locator('[data-freshness="unknown"]');
    await expect(badge).toBeVisible({ timeout: 20000 });
    await expect(badge).toContainText(/freshness unknown/i);
    await expect(page.locator('[data-freshness="fresh"]')).toHaveCount(0);
  });

  test('delayed indexer: 504 timeout envelope shows unavailable notice without fabricating events', async ({
    page,
  }) => {
    await page.route(INDEXER_EVENTS_URL, (route) =>
      route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: { code: 'timeout', message: 'Indexer request timed out' },
        }),
      })
    );

    await page.goto(INVOICE_PATH, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const notice = page.getByTestId('indexer-notice-unavailable');
    await expect(notice).toBeVisible({ timeout: 20000 });
    await expect(notice).toContainText(/temporarily unavailable/i);
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
    await expect(page.getByText(/Unknown actor/i)).toHaveCount(0);
  });
});
