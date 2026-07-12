# useWallet Hook

A React hook for wallet connection with Stellar SEP-10 authentication support.

## Overview

The `useWallet()` hook provides a clean, type-safe interface for:

- Connecting to Stellar wallets (Freighter, WalletConnect)
- Performing SEP-10 authentication flow automatically on first connect
- Managing authentication tokens (JWT) securely in memory
- Signing transactions
- Disconnecting and clearing sensitive data

## Features

✅ **SEP-10 Authentication**: Automatically triggers challenge/verify flow on first connect
✅ **Secure Token Storage**: JWT stored in memory only, never in localStorage
✅ **Automatic Cleanup**: JWT cleared immediately on disconnect
✅ **Type-Safe**: Full TypeScript support with comprehensive types
✅ **Error Handling**: Graceful error handling with retry capability
✅ **Transaction Signing**: Direct wallet transaction signing

## API

### Return Type: `UseWalletReturn`

```typescript
interface UseWalletReturn {
  /** Wallet is currently connected */
  isConnected: boolean;

  /** Public key of the connected wallet */
  publicKey: string | null;

  /** Connect wallet and perform SEP-10 auth */
  connect: () => Promise<void>;

  /** Disconnect wallet and clear JWT */
  disconnect: () => void;

  /** Sign a transaction with the connected wallet */
  signTransaction: (txXdr: string) => Promise<string>;

  /** Current JWT token (in memory only) */
  jwt: string | null;
}
```

## Usage

### Basic Connection Flow

```typescript
import { useWallet } from "@/hooks/useWallet";

export function WalletStatus() {
  const { isConnected, publicKey, connect, disconnect, jwt } = useWallet();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {publicKey?.substring(0, 6)}...</p>
          <p>Authenticated: {jwt ? "Yes" : "No"}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Signing Transactions

```typescript
const { signTransaction, isConnected } = useWallet();

async function submitTransaction() {
  if (!isConnected) {
    alert('Please connect your wallet');
    return;
  }

  try {
    const signedTx = await signTransaction(transactionXdr);
    // Submit signed transaction to network
    await submitToNetwork(signedTx);
  } catch (error) {
    console.error('Failed to sign transaction:', error);
  }
}
```

### Using JWT Token for Authenticated Requests

```typescript
const { jwt } = useWallet();

async function fetchUserData() {
  const response = await fetch('/api/user/profile', {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  return response.json();
}
```

## SEP-10 Authentication Flow

The hook automatically manages the complete SEP-10 authentication flow on first connect:

```
1. connect() called
   ↓
2. Wallet connection initiated via WalletProvider
   ↓
3. SEP-10 challenge fetched from /api/auth/challenge
   ↓
4. Challenge signed with user's wallet
   ↓
5. Signed challenge submitted to /api/auth/verify
   ↓
6. JWT received and stored in memory
   ↓
7. ready for authenticated API calls
```

### JWT Storage & Security

- **Storage**: JWT is stored in memory only (`jwtToken` module variable)
- **Persistence**: JWT is NOT persisted to localStorage or any other storage
- **Lifetime**: JWT exists for the duration of the browser session
- **Cleanup**: JWT is automatically cleared on disconnect, page refresh, or browser close

## API Endpoints Required

The hook expects these endpoints to be available:

### GET /api/auth/challenge

Generates a SEP-10 challenge transaction.

**Query Parameters:**

- `account` (required): Public key of the user's wallet

**Response:**

```json
{
  "challenge": "AAAAAgAAAAA..."
}
```

### POST /api/auth/verify

Verifies the signed challenge and returns a JWT token.

**Request Body:**

```json
{
  "account": "G...",
  "transaction": "AAAAAwAAAAA..."
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Error Handling

The hook provides comprehensive error handling:

```typescript
const { connect } = useWallet();

async function handleConnect() {
  try {
    await connect();
  } catch (error) {
    if (error.message.includes('challenge')) {
      // SEP-10 authentication failed
      console.error('Authentication failed:', error);
    } else if (error.message.includes('not installed')) {
      // Wallet not installed
      console.error('Wallet not installed:', error);
    } else {
      // Other connection error
      console.error('Connection failed:', error);
    }
  }
}
```

## Requirements

- React 16.8+ (for hooks)
- `@stellar/freighter-api` for wallet integration
- `@stellar/stellar-sdk` for Stellar operations
- WalletProvider context wrapping your component tree

## Constraints

- Must be used within a `WalletProvider` component
- JWT is per-session only (not persisted)
- SEP-10 auth is attempted only once per wallet connection
- Requires valid API endpoints for challenge/verify flow

## Best Practices

1. **Always check `isConnected`** before accessing `publicKey` or calling `signTransaction`
2. **Handle JWT expiration** gracefully - implement token refresh if needed
3. **Use `.substring(0, 6)`** when displaying public keys for UX
4. **Catch errors from `connect()`** - network issues can occur
5. **Clear sensitive data** - don't log or expose JWT tokens
6. **Re-authenticate on page refresh** - JWT is cleared on reload

## Environment Variables

For API endpoints, set these in `.env.local`:

```
SEP10_SERVER_SECRET_KEY=your-server-secret-key
JWT_SECRET_KEY=your-jwt-secret
```

## Testing

See [useWallet.test.ts](./__tests__/useWallet.test.ts) for comprehensive test examples including:

- Initial state validation
- Connection flow with SEP-10
- Disconnect and JWT cleanup
- Error handling
- JWT memory-only storage verification
