# Notifications service failure modes

The ILN frontend consumes two caller-facing surfaces of the backend _notifications_
service:

1. **The notifications read path** — `app/api/notifications/[address]/route.ts`
   proxies to the external `NOTIFICATION_API` (`/notifications/:address`) and
   feeds `src/components/NotificationBell.tsx`.
2. **The reminders write path** — `app/api/reminders/route.ts` persists a
   payer's email-reminder preference to Supabase, with the actual delivery
   (via Resend) happening later in the cron GET handler.

This document describes how the frontend distinguishes the service's failure
modes so the UI shows the _right_ user-facing guidance instead of a generic
error or a silent blank state. See `src/lib/notifications.ts` for the shared
definitions.

## Failure modes

| Kind           | HTTP signal             | Meaning                                                              | Frontend behavior                                                                 |
| -------------- | ----------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `rate-limited` | `429`                   | The client hit the service/route quota                               | Warn "too many attempts", suggest retrying later; never present as a hard failure |
| `circuit-open` | `5xx`                   | The service's circuit breaker tripped; delivery temporarily degraded | Keep showing cached data + a "temporarily unavailable" marker                     |
| `unavailable`  | network error / timeout | The service cannot be reached                                        | Same treatment as `circuit-open`                                                  |

`src/lib/notifications.ts` defines `NotificationsServiceError` (`kind`,
optional `retryAfterSeconds`), `getNotifications`, and
`getNotificationsServiceStatus` (a `/health` probe with a 2s timeout).

## Read path (NotificationBell)

- `getNotifications` maps `429` → `rate-limited`, `5xx` → `circuit-open`, and
  fetch rejection → `unavailable`.
- `app/api/notifications/[address]/route.ts` **no longer swallows** every error
  into a `[]` response. It returns distinct `429` / `503` statuses with a `kind`
  and an optional `Retry-After` header.
- `NotificationBell` keeps previously merged/cached notifications on a
  `429`/`503` and renders a small amber indicator (`data-testid` =
  `notification-service-unavailable`) with honest `aria-label`/`title` text. It
  never clears cached notifications on a degraded response.

## Write path (PayerReminderOptIn)

- `POST /api/reminders` persists the preference regardless of delivery health.
  Because the caller cannot reach into the async cron delivery, the route probes
  `getNotificationsServiceStatus()` at save time and returns a structured body:

  ```json
  { "success": true, "saved": true, "delivery": "ok" | "degraded", "retryAfterSeconds"?: number }
  ```

- `PayerReminderOptIn.handleSave` distinguishes the cases:
  - `delivery: "ok"` → success toast.
  - `delivery: "degraded"` → **warning** "Preference saved, delivery temporarily
    degraded" — the user does **not** need to re-enter anything.
  - `429` → warning "Too many attempts".
  - other non-OK → error "Save failed".

This avoids the previous behavior where a degraded delivery channel was shown
to the user as a generic "Save failed" (which incorrectly implied the
preference was not saved).
