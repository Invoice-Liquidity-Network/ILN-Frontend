# LP Position Notifications Implementation Summary

## Overview
Successfully implemented LP position notifications for funded invoice state changes and due date monitoring. The system now sends both in-app toast notifications and persistent notifications stored in a notification center.

## What Was Implemented

### 1. **Enhanced NotificationContext** 
   - **Location**: `src/context/NotificationContext.tsx`
   - Manages a list of notifications with full read/unread state
   - Stores up to 20 most recent notifications in localStorage
   - Provides methods: `addNotification()`, `markAsRead()`, `markAllAsRead()`
   - Notification types: `"funded" | "settled" | "expired" | "disputed" | "info" | "warning"`

### 2. **LP Position Polling Hook**
   - **Location**: `src/hooks/usePositionPolling.ts`
   - **Triggers notifications** on invoice state transitions:
     - `Funded → Paid`: Success toast + notification "Invoice #X paid - You earned Y USDC"
     - `Funded → Defaulted`: Error toast + notification "Invoice #X expired"
     - `Funded → Cancelled`: Error toast + notification "Invoice #X disputed"
     - **Due date expiry**: Detects when funded invoice's due date has passed
   - Polls every 60 seconds
   - Only tracks invoices funded by the connected wallet address
   - Yields formatted as USDC in notifications

### 3. **Notification Bell Component**
   - **Location**: `src/components/NotificationBell.tsx`
   - Fixed position bell icon in top navbar
   - Displays unread badge with count
   - Polls external API (`/api/notifications/[address]`) every 60 seconds
   - Merges external and local notifications
   - Sorted by most recent first
   - Opens notification drawer when clicked

### 4. **Notification Drawer/Center**
   - **Location**: `src/components/NotificationDrawer.tsx`
   - Displays last 20 notifications with timestamps
   - Click individual notification to mark as read
   - "Mark all as read" button
   - Color-coded by notification type (red for expired/disputed, blue for settled, etc.)
   - Empty state when no notifications
   - Dark mode support

### 5. **LPDashboard Integration**
   - **Location**: `src/components/LPDashboard.tsx`
   - Integrated `usePositionPolling` hook to monitor funded invoices
   - Passes required callbacks (`addToast`, `addNotification`)
   - Continuously monitors for state changes while LP is viewing dashboard

### 6. **Test Coverage**
   - **Location**: `__tests__/usePositionPolling.test.ts`
   - Tests all notification triggers and state transitions
   - Validates address filtering
   - Tests null/undefined handling
   - Verifies one-time expiry notifications

## Architecture Flow

```
LP Views Dashboard
    ↓
LPDashboard Component Loads
    ↓
usePositionPolling Hook Starts
    ├─ Monitors all funded invoices by current address
    ├─ Polls every 60 seconds
    └─ Compares previous states with current states
        ├─ Funded → Paid? → addToast("success") + addNotification("settled")
        ├─ Funded → Defaulted? → addToast("error") + addNotification("expired")
        ├─ Funded → Cancelled? → addToast("error") + addNotification("disputed")
        └─ Due date passed? → addToast("error") + addNotification("expired")
    ↓
Toast Displays (auto-dismisses in 6s)
    ↓
Notification Saved to Context
    ├─ Stored in memory
    └─ Persisted to localStorage
    ↓
Bell Icon Updates
    ├─ Unread count badge
    └─ User can click to view notification center

External API Notifications
    ├─ Polled every 60 seconds
    ├─ Merged with local notifications
    └─ Deduped by ID
```

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `src/context/NotificationContext.tsx` | Modified | Enhanced with notification items, read state, localStorage persistence |
| `src/components/NotificationBell.tsx` | Modified | Refactored to use context, merge external notifications |
| `src/components/NotificationDrawer.tsx` | Modified | Refactored to use context, improved UI |
| `src/components/LPDashboard.tsx` | Modified | Added usePositionPolling hook integration |
| `src/hooks/usePositionPolling.ts` | New | Position polling and notification logic |
| `__tests__/usePositionPolling.test.ts` | New | Test coverage for polling hook |

## Notification Types

1. **Settled (Blue)**: Invoice paid successfully
2. **Expired (Red)**: Invoice defaulted or due date passed
3. **Disputed (Orange)**: Invoice cancelled/disputed
4. **Success/Error Toast**: Immediate feedback on state changes

## User Experience

1. **LP funds an invoice** → Added to monitoring list
2. **Payer pays the invoice** → Toast appears "Invoice #X paid" + Notification
3. **LP clicks bell icon** → Notification drawer opens showing last 20 events
4. **LP clicks notification** → Marked as read (visual change)
5. **Due date passes** → One-time expiry notification sent
6. **Page refresh** → Notifications persist from localStorage

## Testing

Run tests with:
```bash
npm test usePositionPolling.test.ts
```

Tests verify:
- ✅ Paid notification triggers correctly
- ✅ Defaulted notification triggers correctly
- ✅ Disputed notification triggers correctly
- ✅ Due date expiry notification fires once
- ✅ Only notifies for LP's own funded invoices
- ✅ No notifications when address is null

## Payer Email Reminders Implementation Summary

### Overview
Implemented an opt-in email reminder system for payers using Resend and Supabase. Payers can now subscribe to receive email notifications 72 hours and 24 hours before their outstanding invoices are due.

### What Was Implemented

#### 1. **Email Template**
   - **Location**: `src/emails/PaymentReminder.tsx`
   - Built with `react-email`
   - Includes invoice ID, amount, token, due date, and deep links to the payer dashboard and "Pay Now" page.

#### 2. **Reminders API Route**
   - **Location**: `app/api/reminders/route.ts`
   - `POST`: Saves or updates payer email preferences in Supabase.
   - `GET`: Background job logic (secured by `CRON_SECRET`) that:
     1. Fetches all active reminder preferences.
     2. Identifies funded invoices due in 72h or 24h.
     3. Sends emails via Resend SDK for each milestone once.
     4. Tracks sent emails in a `sent_reminders` table to prevent duplicates.

#### 3. **Unsubscribe Route**
   - **Location**: `app/api/reminders/unsubscribe/route.ts`
   - Simple GET handler to disable reminders for a given address.

#### 4. **Payer Dashboard UI**
   - **Location**: `src/components/payer/PayerReminderOptIn.tsx`
   - A modern opt-in form integrated into the Payer Dashboard.
   - Allows users to enter their email and toggle reminders on/off.

#### 5. **Database Integration (Supabase)**
   - **Location**: `src/lib/supabase.ts`
   - Configured Supabase client for persistence.
   - Requires two tables: `reminder_preferences` and `sent_reminders`.

#### 6. **API Testing**
   - **Location**: `__tests__/reminders.test.ts`
   - Full test coverage for the API route with mocked Resend SDK and Supabase client.
   - Verifies opt-in saving, milestone detection, and duplicate prevention.

### Setup Instructions

1. **Environment Variables**:
   - `RESEND_API_KEY`: API key from resend.com
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase credentials.
   - `SUPABASE_SERVICE_ROLE_KEY`: Required for the background cron job to bypass RLS.
   - `CRON_SECRET`: Secret token for securing the trigger endpoint.

2. **Cron Job**:
   - Set up a periodic job (e.g., via Vercel Cron or GitHub Actions) to call `GET /api/reminders` with the `Authorization: Bearer <CRON_SECRET>` header.

## No Breaking Changes

- All existing functionality preserved
- Providers already in place (`app/layout.tsx`)
- Backward compatible with existing notification API
- No modifications to invoice contract/types
