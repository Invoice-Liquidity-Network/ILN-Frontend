import { describe, expect, it, vi } from 'vitest';
import { formatLedgerWindow, hashEvidence } from '../evidence';

describe('evidence helpers (#1300)', () => {
  it('hashes evidence deterministically', async () => {
    await expect(hashEvidence('payer supplied proof')).resolves.toBe(
      await hashEvidence('payer supplied proof')
    );
  });

  it('formats appeal windows from ledgers', () => {
    expect(formatLedgerWindow(17280)).toContain('ledgers');
    expect(formatLedgerWindow(0)).toBe('0 ledgers (0h)');
  });

  it('canonicalizes whitespace so the committed evidence hash is reproducible', async () => {
    await expect(hashEvidence('  payer supplied proof  ')).resolves.toBe(
      await hashEvidence('payer supplied proof')
    );
  });

  it('does not produce an evidence payload for blank input', async () => {
    await expect(hashEvidence(' \n\t ')).resolves.toBe('');
  });

  it('produces a fixed-length 64-char SHA-256 hex digest with no PII or document content', async () => {
    const piiTokens = [
      'Alice Johnson',
      'alice.johnson@example.com',
      '123-45-6789',
      '742 Evergreen Terrace',
      'INV-2026-00981',
    ];
    const evidenceText = `Claimant: ${piiTokens[0]} <${piiTokens[1]}>, SSN ${piiTokens[2]}, Address: ${piiTokens[3]}, Ref: ${piiTokens[4]}`;

    const digest = await hashEvidence(evidenceText);

    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    for (const token of piiTokens) {
      expect(digest.toLowerCase()).not.toContain(token.toLowerCase());
    }
  });

  it('produces distinct hashes for distinct PII payloads without collisions', async () => {
    const hashA = await hashEvidence('Invoice #101 disputed by alice@example.com');
    const hashB = await hashEvidence('Invoice #101 disputed by bob@example.com');

    expect(hashA).not.toBe(hashB);
    expect(hashA).toMatch(/^[0-9a-f]{64}$/);
    expect(hashB).toMatch(/^[0-9a-f]{64}$/);
  });

  it('does not log document content or PII to console methods', async () => {
    const spies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'info').mockImplementation(() => {}),
      vi.spyOn(console, 'debug').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ];

    try {
      await hashEvidence('Confidential contract PDF: SSN 123-45-6789, payer@corp.test');
      for (const spy of spies) {
        expect(spy).not.toHaveBeenCalled();
      }
    } finally {
      for (const spy of spies) {
        spy.mockRestore();
      }
    }
  });

  it('remains deterministic and strips PII even when crypto.subtle is unavailable', async () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', undefined);

    try {
      const secret = 'Sensitive dispute note for john.doe@example.com';
      const first = await hashEvidence(secret);
      const second = await hashEvidence(`  ${secret}  `);

      expect(first).toBe(second);
      expect(first).toMatch(/^local-[0-9a-f]{8}$/);
      expect(first).not.toContain('john.doe');
      expect(first).not.toContain('Sensitive');
    } finally {
      vi.stubGlobal('crypto', originalCrypto);
    }
  });
});
