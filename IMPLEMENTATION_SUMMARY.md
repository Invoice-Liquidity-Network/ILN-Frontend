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

## No Breaking Changes

- All existing functionality preserved
- Providers already in place (`app/layout.tsx`)
- Backward compatible with existing notification API
- No modifications to invoice contract/types
