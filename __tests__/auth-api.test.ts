/**
 * Route handlers are server-side: run them in a Node environment so the Stellar
 * SDK gets real Buffer/Uint8Array instances (jsdom's Buffer polyfill makes
 * Keypair.fromSecret throw "private key must be hex string or Uint8Array").
 *
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/auth/challenge';
import { POST } from '../app/api/auth/verify';

describe('/api/auth Integration Tests', () => {
  const validPublicKey = 'GDVEU3DD4KOFECV66VIHWEZOYX4ZKR3WV27L464SIIPOU2IUI3JCZA57';
  // The challenge route needs a real signing key; the hard-coded fallback in the
  // route is not a valid Stellar secret, so provide one explicitly.
  const serverSecret = 'SADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP54X';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('SEP10_SERVER_SECRET_KEY', serverSecret);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('GET /api/auth/challenge (SEP-10 Challenge)', () => {
    it('returns 400 if account query parameter is missing', async () => {
      const req = new NextRequest('http://localhost/api/auth/challenge');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Missing 'account' parameter");
    });

    it('returns 400 if account public key is invalid', async () => {
      const req = new NextRequest('http://localhost/api/auth/challenge?account=invalid_key');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid public key format');
    });

    it('returns 200 with a valid XDR challenge transaction for valid public key', async () => {
      const req = new NextRequest(`http://localhost/api/auth/challenge?account=${validPublicKey}`);
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.challenge).toBeDefined();
      expect(typeof body.challenge).toBe('string');
    });
  });

  describe('POST /api/auth/verify (SEP-10 Verification)', () => {
    it('returns 400 if account or transaction is missing from request body', async () => {
      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ account: validPublicKey }),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Missing 'account' or 'transaction' in request body");
    });

    it('returns 400 if account is not a valid Ed25519 public key', async () => {
      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ account: 'invalid_key', transaction: 'tx_xdr' }),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid public key format');
    });

    it('returns 400 if transaction parsing/verification fails', async () => {
      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ account: validPublicKey, transaction: 'invalid_xdr_payload' }),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid signed transaction');
    });
  });
});
