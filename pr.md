# Fix: InvoiceFilterBar Date Range Picker, OfflineBanner SW Integration, LPYieldComparison Historical Data, VoteProgressBar Animation

Closes #363, #364, #365, #366

## Summary

This PR implements four features across the governance, LP, invoice, and offline UX areas.

### #366 — InvoiceFilterBar Date Range Picker

- Added a **Due Date / Funded Date** toggle so users can filter invoices by the date field that matters for their context.
- Added **quick preset buttons** — Today, This Week, This Month — that apply and toggle a date range in one click.
- Added an inline **Clear date** button that appears only when a date range is active.
- Added `min`/`max` constraints on the custom date inputs to prevent invalid ranges.
- Extended `useInvoiceFilters` with a `dateType` field (`'due' | 'funded'`) serialised to URL search params; `applyInvoiceFilters` now filters by `invoice.funded_at` when `dateType === 'funded'`.

### #365 — OfflineBanner Service Worker Integration

- Detects whether the service worker is registered and active via `navigator.serviceWorker.ready` and the `controllerchange` event.
- Displays an **"Offline cache active"** indicator (with ShieldCheck icon) when the SW is running, so users know cached invoices and portfolio data are available offline.
- Displays **"No offline cache"** when the SW is unavailable, setting clear expectations.
- On reconnection, triggers `SyncManager.register('sync-queued-requests')` (where supported) and posts a `SYNC_ON_RECONNECT` message to the active SW worker, in addition to the existing React Query resume/refetch.
- Added `role="alert"` and `aria-live="assertive"` for screen-reader announcement of the offline state.

### #364 — LPYieldComparison Historical Data

- Added a **7D / 30D / 90D range selector** that drives `buildYieldTimeSeries`; updated `YieldRange` type to include `7`.
- Replaced the single-token line chart with a **comparative multi-token chart** showing USDC, EURC, and XLM as separate lines with a Legend — the selected token renders at full opacity while others are dimmed.
- Added an **Export CSV** button that downloads `yield-comparison-<range>.csv` with date, per-token yield, and total columns.

### #363 — VoteProgressBar Animation

- Animation is now **suppressed on initial render** using `useRef` + `useEffect`; bars fill instantly on mount and only animate on subsequent vote data changes.
- Changed easing to **`ease-in-out`** on all bars (500 ms in compact mode, 700 ms in full mode).
- Added a **color transition at the 50 % threshold**: the For bar and label shift from `emerald-500` to `emerald-600` when votes for exceed 50 %, providing a clear winning-state signal.

## Test plan

- [ ] Open the invoice list, expand Filters, and verify the Date Range section shows Due Date / Funded Date toggle, preset buttons, and custom inputs.
- [ ] Click "Today", "This Week", "This Month" — confirm dates populate correctly and clicking again clears them.
- [ ] Switch to "Funded Date" and confirm invoices filter by `funded_at`.
- [ ] Go offline in DevTools → confirm the OfflineBanner appears with the SW cache status message; go online → confirm the sync toast fires and the banner dismisses.
- [ ] Open the LP Yield Comparison, switch between 7D / 30D / 90D, confirm the chart updates.
- [ ] Confirm all three token trend lines render with the selected token highlighted.
- [ ] Click Export CSV and verify the downloaded file contains the correct columns and data.
- [ ] Open a governance proposal, observe the vote bars appear instantly without animation on load.
- [ ] Update vote counts (or simulate via Storybook) and verify the 500/700 ms ease-in-out animation fires and the For bar color changes when it crosses 50 %.
