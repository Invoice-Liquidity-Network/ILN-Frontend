# feat: invoice marketplace bookmark, hero animations, error boundary dev tools, sound settings

## Summary

Closes #359, #360, #361, #362.

### #359 — InvoiceMarketplaceCard Bookmark Feature
- Added `useBookmarks` hook (`src/hooks/useBookmarks.ts`) that persists bookmarked invoice IDs to `localStorage`, enforces a maximum of 100 bookmarks, and exposes `toggleBookmark`, `isBookmarked`, `clearAll`, `count`, and `atLimit`.
- Fixed duplicate `onQuickFund` prop declaration in `InvoiceMarketplaceCard`.
- Wired `isBookmarked` / `onBookmark` into each card on the marketplace page.
- Added a **Bookmarked** filter button to the marketplace filter bar; toggling it shows only bookmarked invoices and displays a live count badge.

### #360 — Hero Section Animations
- Tightened the `heroFadeInUp` keyframe to use `ease-out` for a more natural deceleration curve.
- Added an explicit `opacity: 1` baseline rule to `.hero-animate` so elements remain fully visible when `prefers-reduced-motion: reduce` is active — eliminating any risk of invisible content in that mode.
- Existing stagger (200 ms between elements, 600 ms per animation) and `animation-fill-mode: both` were preserved.
- Fixed a Tailwind canonical-class warning: `hover:translate-y-[-2px]` → `hover:-translate-y-0.5`.

### #361 — ErrorBoundary Dev Mode Details
- `componentDidCatch` now captures `React.ErrorInfo.componentStack` and stores it in state.
- In dev mode the error UI now shows two collapsible `<details>` panels: **Stack trace** (open by default) and **Component hierarchy**.
- The copy-to-clipboard payload now includes the component stack alongside the JS stack trace.
- Added a **Docs** link (dev mode only) pointing to the React error-boundary reference documentation, opened in a new tab.

### #362 — useSoundNotifications Config Panel
- Created `SoundNotificationSettings` component (`src/components/SoundNotificationSettings.tsx`) that consumes the existing `useSoundNotifications` hook.
- UI provides: enable/disable toggle switch, mute toggle switch, volume slider (0–100 %), and two preview buttons (success chime / alert tone).
- All controls are disabled when the feature is off or muted. Settings are persisted automatically by the hook via `localStorage`.

## Test plan

- [ ] On the marketplace page, bookmark several invoices and confirm the bookmark icon toggles and the count badge updates.
- [ ] Reload the page and verify bookmarks persist.
- [ ] Enable "Bookmarked" filter — confirm only bookmarked invoices are shown.
- [ ] Attempt to bookmark 101 invoices — confirm the 101st is silently rejected.
- [ ] On the landing page, confirm fade-in-up animations play in sequence with ~200 ms stagger.
- [ ] Enable `prefers-reduced-motion: reduce` in the OS / browser and verify all hero content is fully visible with no animations.
- [ ] Trigger a component error in dev mode — confirm stack trace and component hierarchy panels appear and are readable, the copy button includes both, and the Docs link opens the correct React page.
- [ ] Open `SoundNotificationSettings`, enable sounds, adjust volume, and click both preview buttons — confirm audio plays at the expected pitch/volume.
- [ ] Reload and verify sound settings persisted.
