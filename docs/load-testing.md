# Large-Scale Load Testing (Mainnet-Scale Invoice Volumes)

**Issue:** [Invoice-Liquidity-Network/ILN-Frontend#727](https://github.com/Invoice-Liquidity-Network/ILN-Frontend/issues/727)

This document records the large-scale rendering audit of the key list/tabular
pages and the actions taken to keep them responsive when a user has a
mainnet-scale number of invoices (thousands to tens of thousands).

## Audit: which pages render list/table content

| Page                          | Rendered content                      | Bounding before                                            | Status    |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------- | --------- |
| `/marketplace`                | Open invoice table                    | Already paginated, 20/page                                 | OK        |
| `/leaderboard`                | LPs table                             | Already paginated, 20/page (top-50)                        | OK        |
| `/stats`                      | Aggregated cards + chart              | No unbounded DOM list (CPU-bound only; not addressed here) | OK        |
| `/dashboard` (timeline)       | Event timeline                        | "Load more" 20+20                                          | OK        |
| `/dashboard` (table mode)     | A freelancer's **entire** invoice set | **Unbounded** (every filtered/sorted row mounted)          | **Fixed** |
| `/lp` (discovery / watchlist) | **All** matching/funded invoices      | **Unbounded**                                              | **Fixed** |

## Problem

`/dashboard` table mode and the `/lp` discovery/watchlist table rendered every
matching invoice into the DOM at once. At mainnet scale this creates thousands
of table rows, which degrades initial render, layout, and scroll/interaction
performance and can stall the main thread.

## Approach: bounded "Load more" window (no new dependency)

Rather than add a virtualization dependency (e.g. `react-window`), both
unbounded lists now mount only a fixed-size window and reveal more on demand via
a "Load more" button. This bounds the DOM to a constant number of rows
regardless of list size, with negligible interaction cost, and keeps the initial
paint fast.

Introduced a shared hook, `useVisibleWindow` (`src/hooks/useVisibleWindow.ts`),
that both pages use:

- Renders only the first `pageSize` (50) items.
- `loadMore()` reveals the next `pageSize` items (a no-op once exhausted).
- Resets to `pageSize` whenever the underlying data/filters/sort change, so the
  user sees results from the top again.
- Emits `list:visible-window` analytics (via `src/lib/analytics.ts`) recording
  `{ list, visibleCount, total, hasMore }` for every window change, giving a
  measurable signal of how much of a list is actually mounted.

### Changed files

- `src/hooks/useVisibleWindow.ts` — new shared bounded-window hook + instrumentation.
- `src/screens/Dashboard.tsx` — table mode now renders `visibleSlice(displayedInvoices)`
  and a "Load more (N remaining)" button in the table footer.
- `src/components/LPDashboard.tsx` — discovery/watchlist tables render a bounded
  window and a "Load more (N remaining)" button.
- `src/hooks/__tests__/useVisibleWindow.test.tsx` — hook unit tests (window sizing,
  growth, exhaustion no-op, reset on dependency change).

## Reproducing the load test

1. **Seed volume.** Create a wallet holding a large invoice set. A fast way to
   simulate mainnet scale without a real ledger is to stub the data source
   (MSW handler for the invoices query) to return N invoices, e.g.
   `N = 2_000`, `5_000`, and `10_000`.

2. **Measure TTI + scroll.** Open the page in a clean profile with throttle
   (e.g. 6x CPU / 4x network) and record:

   - **Time to Interactive (TTI)** — performance entry observed via
     `performance.getEntriesByType('longtask')` and `LargestContentfulPaint`.
   - **First interaction latency** — time from first click to the table being
     responsive.
   - **Scroll frame rate** — use the DevTools Performance recorder and count
     dropped frames while scrolling to the bottom of the table.

3. **Verify the bounded window.** With the DevTools console listening for the
   analytics event:

   ```js
   window.addEventListener('iln:analytics', (e) => console.log(e.detail));
   ```

   The `list:visible-window` events should show `visibleCount` capped at the
   page size (50) and growing only when "Load more" is clicked, while `total`
   reflects the full seeded size.

4. **Before/after.** Repeat steps 1-3 on the pre-change commit (`main`) and on
   this branch. Expect:
   - ~Constant initial render cost regardless of `N` (window capped at 50).
   - Number of DOM `<tr>` elements ≈ `visibleCount` (not `N`).
   - No long tasks / dropped frames attributable to rendering the full list.

## Example

With `seedN = 10_000` on `/dashboard` table mode:

- **Before:** 10,000 `<tr>` mounted; TTI and first scroll interaction degrade
  sharply; long tasks > 200 ms common.
- **After:** 50 `<tr>` mounted initially; "Load more" reveals 50 at a time;
  TTI and scrolling remain flat across `N`.
