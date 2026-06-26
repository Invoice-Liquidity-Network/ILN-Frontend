# useWallet Hook - Quick Reference

## Installation & Setup

```tsx
// 1. Wrap your app with WalletProvider
import { WalletProvider } from "@/context/WalletContext";

export default function App() {
  return (
    <WalletProvider>
      <YourComponents />
    </WalletProvider>
  );
}

// 2. Use the hook in any component
import { useWallet } from "@/hooks/useWallet";

export function MyComponent() {
  const { isConnected, publicKey, connect, disconnect, jwt } = useWallet();
  // ...
}
```

## API Quick Reference

### Connection

```typescript
const { connect, disconnect, isConnected } = useWallet();

// Connect wallet + SEP-10 auth
await connect();          // Triggers SEP-10 flow automatically

// Disconnect and clear JWT
disconnect();             // Clears JWT from memory
```

### Authentication

```typescript
const { jwt } = useWallet();

// Check if authenticated
if (jwt) {
  // Make authenticated requests
  fetch('/api/protected', {
    headers: { Authorization: `Bearer ${jwt}` }
  });
}
```

### Public Key

```typescript
const { publicKey, isConnected } = useWallet();

// Display user address
if (isConnected) {
  const display = `${publicKey?.substring(0, 6)}...${publicKey?.substring(-4)}`;
  console.log(display);
}
```

### Transaction Signing

```typescript
const { signTransaction, isConnected } = useWallet();

if (isConnected) {
  const signedXdr = await signTransaction(transactionXdr);
  // Submit signed transaction to network
}
```

## Common Patterns

### Pattern 1: Connect & Authenticate

```tsx
export function ConnectButton() {
  const { isConnected, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading || isConnected}>
      {isConnected ? "Connected" : loading ? "Connecting..." : "Connect"}
    </button>
  );
}
```

### Pattern 2: Protected Component

```tsx
export function ProtectedContent() {
  const { isConnected, jwt } = useWallet();

  if (!isConnected || !jwt) {
    return <p>Please connect and authenticate</p>;
  }

  return <YourContent />;
}
```

### Pattern 3: Authenticated API Calls

```tsx
async function fetchUserData(jwt: string | null) {
  if (!jwt) throw new Error("Not authenticated");

  const response = await fetch("/api/user/data", {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) throw new Error("Request failed");
  return response.json();
}
```

### Pattern 4: Sign & Submit

```tsx
export function SignTransaction() {
  const { signTransaction, isConnected } = useWallet();

  const handleSubmit = async (txXdr: string) => {
    if (!isConnected) {
      alert("Connect wallet first");
      return;
    }

    try {
      const signed = await signTransaction(txXdr);
      await submitToNetwork(signed);
      alert("Success!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    // JSX here
  );
}
```

## State Reference

```typescript
// Connection States
isConnected: boolean        // true = wallet connected
publicKey: string | null    // User's Stellar address

// Authentication States
jwt: string | null          // Current auth token (memory)

// Method Types
connect: () => Promise<void>
disconnect: () => void
signTransaction: (txXdr: string) => Promise<string>
```

## Error Messages & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| `useWallet must be used within a WalletProvider` | Hook used outside provider | Wrap component tree with `<WalletProvider>` |
| `Failed to fetch SEP-10 challenge` | API endpoint missing | Implement `/api/auth/challenge` |
| `Failed to verify challenge` | API endpoint missing | Implement `/api/auth/verify` |
| `Wallet is not connected` | Called signTransaction while disconnected | Check `isConnected` before signing |
| `Freighter not installed` | Extension not installed | Direct user to freighter.app |

## JWT Debugging

```typescript
// Check if authenticated
const { jwt } = useWallet();
console.log(`Authenticated: ${!!jwt}`);

// Decode JWT (client-side, for debugging)
if (jwt) {
  const [header, payload, sig] = jwt.split(".");
  const decoded = JSON.parse(atob(payload));
  console.log("JWT Payload:", decoded);
  console.log("Expires:", new Date(decoded.exp * 1000));
}

// Verify token in requests
fetch("/api/protected", {
  headers: { Authorization: `Bearer ${jwt}` }
}).then(r => {
  if (r.status === 401) console.log("Token expired or invalid");
  return r.json();
});
```

## TypeScript Types

```typescript
interface UseWalletReturn {
  isConnected: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (txXdr: string) => Promise<string>;
  jwt: string | null;
}

// Usage with types
const wallet: UseWalletReturn = useWallet();
```

## Configuration

### Environment Variables

```env
# Required for SEP-10
SEP10_SERVER_SECRET_KEY=S...

# Required for JWT
JWT_SECRET_KEY=your-secret

# Optional - Stellar setup
NEXT_PUBLIC_NETWORK_NAME=TESTNET
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### Backend Routes Required

```
GET  /api/auth/challenge?account=G...
POST /api/auth/verify
```

## Performance Tips

1. **Memoize callbacks** when passing to components
2. **Check `isConnected`** before attempting operations
3. **Cache JWT** if making multiple requests
4. **Handle token expiry** gracefully (24h default)

## Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { useWallet } from "@/hooks/useWallet";
import { WalletProvider } from "@/context/WalletContext";

const wrapper = ({ children }) => (
  <WalletProvider>{children}</WalletProvider>
);

it("should connect wallet", async () => {
  const { result } = renderHook(() => useWallet(), { wrapper });

  await act(async () => {
    await result.current.connect();
  });

  expect(result.current.isConnected).toBe(true);
  expect(result.current.jwt).toBeTruthy();
});
```

## SEP-10 Flow Explained

```
┌─ User clicks "Connect"
│
├─ Wallet provider modal opens
│
├─ User selects Freighter
│
├─ Challenge generated at /api/auth/challenge
│
├─ User signs challenge in wallet
│
├─ Signed challenge sent to /api/auth/verify
│
├─ Server returns JWT token
│
└─ useWallet.jwt is now set ✓
```

## Do's and Don'ts

### ✅ Do

- Always wrap app with `<WalletProvider>`
- Check `isConnected` before sensitive operations
- Use JWT in Authorization header as `Bearer ${jwt}`
- Handle connection errors gracefully
- Handle wallet signing rejections
- Implement token refresh for long sessions

### ❌ Don't

- Store JWT in localStorage (defeats purpose)
- Call `signTransaction` without checking `isConnected`
- Expose JWT in logs or console
- Hard-code wallet addresses
- Assume JWT persists across page reloads
- Skip error handling on async operations

## Useful Links

- [Hook Documentation](./src/hooks/useWallet.README.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE_useWallet.md)
- [Examples](./src/hooks/useWallet.examples.tsx)
- [Tests](./src/hooks/__tests__/useWallet.test.ts)
- [SEP-10 Protocol](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046-06.md)
- [Freighter API](https://stellar.org/docs/building-apps/wallet/freighter)

## Troubleshooting Checklist

- [ ] Is app wrapped with `<WalletProvider>`?
- [ ] Are `/api/auth/challenge` and `/api/auth/verify` endpoints implemented?
- [ ] Are `SEP10_SERVER_SECRET_KEY` and `JWT_SECRET_KEY` set?
- [ ] Is Freighter wallet installed and enabled?
- [ ] Are network settings matching (TESTNET/MAINNET)?
- [ ] Is the device connected to internet?
- [ ] Check browser console for errors
- [ ] Try disconnecting and reconnecting

---

**Last Updated**: June 14, 2026
**Status**: Complete ✅
