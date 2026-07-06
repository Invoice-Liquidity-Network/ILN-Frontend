# useWallet Hook Implementation Guide

## Architecture Overview

The `useWallet()` hook is built on three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    useWallet Hook                            │
│  (Exposes clean interface: isConnected, publicKey, jwt...)  │
├─────────────────────────────────────────────────────────────┤
│           SEP-10 Authentication Functions                    │
│  (performSEP10Auth, fetchChallenge, submitChallenge)        │
├─────────────────────────────────────────────────────────────┤
│              WalletProvider Context                          │
│  (Freighter/WalletConnect integration)                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── WalletProvider
│   └── Your Components
│       └── useWallet Hook
```

## Detailed Flow Diagrams

### Connection Flow

```
User clicks "Connect"
        ↓
   useWallet.connect()
        ↓
   context.connect() [Open provider modal]
        ↓
   User selects provider (Freighter/WalletConnect)
        ↓
   Provider connection established
        ↓
   context.address is set
        ↓
   performSEP10Auth(address)
        ↓
   ├─ fetchSEP10Challenge(address)
   │  └─ GET /api/auth/challenge?account={address}
   │     └─ Returns: { challenge: "AAAAAgAAAAA..." }
   │
   ├─ signTransaction(challenge)
   │  └─ Wallet signs the challenge
   │     └─ Returns: signed challenge XDR
   │
   └─ submitSEP10Challenge(address, signedChallenge)
      └─ POST /api/auth/verify
         └─ Returns: { token: "eyJhbGc..." }
   ↓
   jwtToken = received token (stored in module scope)
   ↓
   hook.jwt is now available
   ↓
   ✓ Connection complete
```

### Disconnect Flow

```
User clicks "Disconnect"
        ↓
   useWallet.disconnect()
        ↓
   jwtToken = null [clear from memory]
   ↓
   context.disconnect()
        ↓
   Router pushes to home page
   ↓
   ✓ Disconnected & JWT cleared
```

### JWT Lifecycle

```
1. Initial State
   └─ jwtToken = null (module variable)

2. After connect() succeeds
   └─ jwtToken = "eyJhbGc..."

3. Available to use
   └─ jwt property exposes the token

4. On disconnect()
   └─ jwtToken = null (cleared)

5. On page reload
   └─ jwtToken = null (not persisted)

6. Browser closes
   └─ jwtToken = null (garbage collected)
```

## Memory Management

### JWT Storage Strategy

The JWT is stored as a **module-level variable** rather than in component state:

```typescript
// ✓ Module-level (persists across hook calls)
let jwtToken: string | null = null;

// This allows multiple instances of useWallet() to share the same token
// while keeping it private and out of localStorage
```

### Advantages

1. **Secure**: Never persisted to localStorage
2. **Shared**: All hook instances access the same token
3. **Simple**: No state management complexity
4. **Ephemeral**: Lost on page refresh
5. **Clean**: Automatically garbage collected on browser close

### Disadvantages (Intentional)

1. **Not persisted**: Requires re-auth on page refresh
2. **Session-only**: No cross-tab sharing
3. **Memory-based**: Lost if application crashes

This is by design - SEP-10 is meant for session-based auth, not persistent login.

## SEP-10 Protocol Details

### Challenge Format

The challenge is a Stellar transaction with:
- Source: Server public key
- Operation: ManageData with account address
- Expiration: 15 minutes (configurable)
- Timebounds: Prevents replay attacks

```
ManageData Operation:
├─ Name: "SEP10 Challenge"
├─ Value: 64 random bytes
└─ Source: User's public key
```

### Verification Process

1. **Signature Check**: Verify transaction is signed by user
2. **Source Check**: Verify the ManageData operation source is the user
3. **Expiration Check**: Verify transaction hasn't expired
4. **Challenge Check**: Verify this is a valid challenge we issued

### JWT Payload

```json
{
  "account": "GBZXN7PIRZGNMHGA7MUSC23TFSQ55TWREN3QQR5UELWXONE4O36XL7QP",
  "iat": 1689971600,
  "exp": 1690058000
}
```

- `account`: User's public key
- `iat`: Issued at (Unix timestamp)
- `exp`: Expires (Unix timestamp) - typically 24 hours

## Integration Checklist

- [x] Hook created with all required exports
- [x] SEP-10 functions implemented (challenge, verify, sign)
- [x] JWT stored in memory only
- [x] Error handling comprehensive
- [x] TypeScript types defined
- [x] Tests written (unit tests)
- [x] API endpoints documented

### To Complete Integration:

1. **Backend Setup**
   - [ ] Implement `/api/auth/challenge` endpoint
   - [ ] Implement `/api/auth/verify` endpoint
   - [ ] Set `SEP10_SERVER_SECRET_KEY` environment variable
   - [ ] Set `JWT_SECRET_KEY` environment variable
   - [ ] Implement JWT verification middleware for protected routes

2. **Frontend Setup**
   - [ ] Wrap app in WalletProvider
   - [ ] Use useWallet hook in components
   - [ ] Add JWT to API request headers

3. **Security**
   - [ ] Validate JWT on backend for protected routes
   - [ ] Implement token refresh if needed
   - [ ] Add CORS configuration
   - [ ] Use HTTPS only

4. **Testing**
   - [ ] Run unit tests: `npm test useWallet`
   - [ ] Manual E2E testing with Freighter
   - [ ] Test error scenarios

## API Endpoint Implementation Notes

### Challenge Endpoint

The challenge endpoint should:
1. Validate the account public key format
2. Create a SEP-10 challenge transaction
3. Return it as XDR (transaction envelope)

Key considerations:
- Use same network passphrase as client
- Set reasonable expiration (typically 15 minutes)
- Include random data in ManageData operation
- Sign with server's private key

### Verify Endpoint

The verify endpoint should:
1. Parse the signed transaction
2. Validate the signature
3. Ensure source of ManageData operation matches account
4. Check expiration hasn't passed
5. Generate and return JWT

Key considerations:
- Verify signature cryptographically
- Check that this is the challenge we issued (optional but recommended)
- Prevent replay attacks (optional but recommended)
- Use strong JWT signing key
- Set appropriate expiration on JWT (24h is typical)

## Error Recovery

### SEP-10 Challenge Failures

If challenge fetch fails:
- Hook catches error
- `authAttemptedRef.current = false` (allows retry)
- Error bubbles to caller
- User can retry by calling `connect()` again

### Wallet Signing Failures

If wallet rejects signing:
- `performSEP10Auth` throws error
- `jwtToken` remains null
- User can retry

### Verify Failures

If server rejects signed transaction:
- Hook catches error
- `jwtToken` remains null
- Error information provided to caller

## Debugging Tips

### Check Connection Status
```typescript
const { isConnected, publicKey } = useWallet();
console.log(`Connected: ${isConnected}, Address: ${publicKey}`);
```

### Check JWT Token
```typescript
const { jwt } = useWallet();
console.log(`JWT Available: ${jwt ? "yes" : "no"}`);

// Decode JWT (client-side only, for debugging)
if (jwt) {
  const [header, payload, sig] = jwt.split('.');
  const decoded = JSON.parse(atob(payload));
  console.log(`JWT Payload:`, decoded);
}
```

### Monitor SEP-10 Flow
```typescript
// Add logging to useWallet.ts for detailed flow tracking
console.log('[SEP-10] Fetching challenge for', publicKey);
console.log('[SEP-10] Challenge received, signing...');
console.log('[SEP-10] Submitting signed challenge...');
console.log('[SEP-10] JWT received:', jwt ? 'yes' : 'no');
```

### Common Issues

1. **"Must be used within WalletProvider"**
   - Ensure WalletProvider wraps your components
   - Check component hierarchy

2. **SEP-10 challenge fails with 404**
   - Verify `/api/auth/challenge` endpoint exists
   - Check API routing configuration

3. **JWT is always null**
   - Check SEP-10 verify endpoint response
   - Verify JWT_SECRET_KEY is set
   - Check server logs for verification errors

4. **Connection works but JWT doesn't persist**
   - This is expected! JWT is memory-only
   - JWT will be cleared on page refresh
   - Implement refresh token flow if persistence needed

## Performance Considerations

- SEP-10 flow adds ~2-3 seconds to connection time (challenge + signing + verify)
- JWT is lightweight and cached in memory
- No network calls needed to access JWT (it's already in memory)
- Disconnect is instant (just clears memory reference)

## Security Considerations

1. **JWT Secret**: Use strong, unique secret for signing JWTs
2. **HTTPS Only**: Never transmit JWTs over HTTP
3. **Token Storage**: Already secure (memory only)
4. **Token Expiration**: Set reasonable expiration (24h recommended)
5. **Replay Protection**: Challenge should be single-use
6. **Signature Verification**: Always verify signatures on backend

## Future Enhancements

Potential improvements:
- [ ] Implement token refresh flow for longer sessions
- [ ] Add token persistence with security key (IndexedDB)
- [ ] Support for multiple wallet providers simultaneously
- [ ] Add CEP-46 (Stellar Protocol 21) support
- [ ] Implement claim-based scopes for fine-grained permissions
- [ ] Add rate limiting to prevent brute force attacks
- [ ] Cache challenges temporarily to prevent DoS

## References

- [SEP-0010: Stellar Authentication](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046-06.md)
- [Freighter API Documentation](https://stellar.org/docs/building-apps/wallet/freighter)
- [Stellar SDK Documentation](https://stellar.org/docs/building-apps)
- [JWT (RFC 7519)](https://datatracker.ietf.org/doc/html/rfc7519)
