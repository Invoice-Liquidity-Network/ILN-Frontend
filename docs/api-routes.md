# API routes reference

This document summarizes the server routes in [app/api](../app/api) that are used by the frontend for reminders, authentication, feedback, and notification lookups.

## `/api/reminders`

### `POST`

Saves or updates the reminder opt-in preference for a wallet address.

- Request body:
  ```json
  {
    "address": "G...",
    "email": "payer@example.com",
    "enabled": true
  }
  ```
- Response:
  ```json
  { "success": true }
  ```
- Auth requirement: none. The route uses the Supabase admin client on the server.
- Error responses:
  - `400` when `address` or `email` is missing.
  - `500` when the Supabase upsert fails.

### `GET`

Triggers reminder emails for active preferences. This is intended for a cron job or manual admin run.

- Auth requirement: `Authorization: Bearer <CRON_SECRET>`.
- Response:
  ```json
  {
    "success": true,
    "sentCount": 1,
    "details": [
      {
        "invoiceId": "42",
        "milestone": 24,
        "email": "payer@example.com"
      }
    ]
  }
  ```
- Error responses:
  - `401` when the bearer token does not match `CRON_SECRET`.
  - `200` with `{ "message": "No active preferences" }` when no reminder preferences are enabled.
  - `500` on internal failures.

Example curl:

```bash
curl -X GET "http://localhost:3000/api/reminders" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## `/api/reminders/unsubscribe`

### `GET`

Disables reminder delivery for a wallet address.

- Query string: `?address=<wallet-address>`
- Response: HTML page that confirms the unsubscribe.
- Auth requirement: none.
- Error responses:
  - `400` when the `address` query parameter is missing.
  - `500` when the update fails.

Example curl:

```bash
curl "http://localhost:3000/api/reminders/unsubscribe?address=G..."
```

## `/api/feedback`

### `POST`

Accepts feedback from the UI and forwards it to GitHub issues when GitHub credentials are configured.

- Request body:
  ```json
  {
    "rating": 5,
    "category": "Bug",
    "feedback": "The dashboard feels slow",
    "email": "user@example.com"
  }
  ```
- Response:
  - Success without GitHub config: `{ "success": true }`
  - Success with GitHub config: `{ "success": true, "issueUrl": "https://github.com/..." }`
- Auth requirement: none.
- Error responses:
  - `400` when `rating`, `category`, or `feedback` is missing.
  - `429` when GitHub returns a rate-limit response; the body includes `error: "rate_limit"` and `retryAfter`.
  - `500` for unexpected failures.

Example curl:

```bash
curl -X POST "http://localhost:3000/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"category":"Bug","feedback":"The dashboard feels slow","email":"user@example.com"}'
```

## `/api/notifications/[address]`

### `GET`

Returns the notification list for a given wallet address.

- Path parameter: `/api/notifications/<address>`
- Response: a JSON array of notification objects with the shape:
  ```json
  [
    {
      "id": "1",
      "category": "invoice",
      "type": "overdue",
      "title": "Invoice overdue",
      "message": "A funded invoice is now overdue",
      "href": "/pay/42",
      "createdAt": "2026-07-26T00:00:00.000Z",
      "read": false
    }
  ]
  ```
- Auth requirement: none.
- Error responses:
  - The route returns an empty array `[]` if notification fetching fails or the upstream service is not configured.

Example curl:

```bash
curl "http://localhost:3000/api/notifications/G..."
```

## Rate limits and operational notes

- The reminders route has no built-in throttling; protect it behind `CRON_SECRET` and a scheduler if you expose it publicly.
- The feedback route inherits GitHub API rate limits and returns a `429` response if the upstream API refuses the request.
- The notifications route is a thin bridge and does not add its own authentication layer.
