import { describe, expect, it } from 'vitest';
import {
  createGovernanceMetadata,
  formatGovernanceLedgerLabel,
  formatGovernanceFreshnessAge,
} from '../governanceFreshness';

describe('Governance Source and Freshness Metadata (#1058)', () => {
  const now = 1700000000000;

  it('creates governance metadata with authoritative ledger sequence and timestamp', () => {
    const meta = createGovernanceMetadata(5432100, now - 10000, 'soroban-rpc', now);

    expect(meta.ledgerSequence).toBe(5432100);
    expect(meta.source).toBe('soroban-rpc');
    expect(meta.isStale).toBe(false);
    expect(meta.freshnessIso).toBe(new Date(now - 10000).toISOString());
  });

  it('formats ledger sequence label with thousands separator', () => {
    const meta = createGovernanceMetadata(1234567, now, 'soroban-rpc', now);
    expect(formatGovernanceLedgerLabel(meta)).toContain('1,234,567');
  });

  it('formats relative freshness age concisely', () => {
    expect(formatGovernanceFreshnessAge(now - 25000, now)).toBe('25s ago');
    expect(formatGovernanceFreshnessAge(now - 300000, now)).toBe('5m ago');
    expect(formatGovernanceFreshnessAge(now - 7200000, now)).toBe('2h ago');
  });

  it('detects and flags stale governance data exceeding threshold', () => {
    const staleTime = now - 20 * 60 * 1000; // 20 mins ago (threshold is 15 mins)
    const meta = createGovernanceMetadata(5000000, staleTime, 'soroban-rpc', now);

    expect(meta.isStale).toBe(true);
  });
});
