# Admin and API audit coverage

This branch records the security controls expected for the admin-facing paths covered by issues #1328, #1332, and #1333.

## Admin actions

Every request, confirmation, success, and failure for protocol pause/unpause, governance execution, and token approval/removal is emitted through `logAdminAction`. Events include the public wallet actor, source page, timestamp, action name, and non-secret metadata. Private keys, bearer tokens, and transaction payloads must never be included.

When adding a new privileged action, add its lifecycle identifiers to `AdminAuditAction` and emit the request event before signing, then success or failure after the result.

## Feedback API

The feedback route applies an IP/client rate limit, a strict JSON shape and field limits, and returns only a generic success response. GitHub issue URLs and provider error payloads are intentionally not exposed to browsers. Upstream provider failures are logged without request content.

## Status webhook

Webhook deliveries use an HMAC-SHA256 signature over `timestamp + "." + raw body`, a five-minute timestamp window, and an optional delivery ID to suppress duplicate deliveries. Signature comparisons are constant-time. Invalid or stale requests return 401 before any side effects.
