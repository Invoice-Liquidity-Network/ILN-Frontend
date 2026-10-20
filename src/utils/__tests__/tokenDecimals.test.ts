import { describe, expect, it } from 'vitest';
import {
  reconcileTokenUnits,
  resolveTokenDecimals,
  CANONICAL_TOKEN_REGISTRY,
} from '../tokenDecimals';

describe('tokenDecimals reconciliation (#1139)', () => {
  it('correctly resolves Stellar native decimals (7 decimals)', () => {
    expect(resolveTokenDecimals('XLM')).toBe(7);
    expect(resolveTokenDecimals('USDC')).toBe(7);
    expect(resolveTokenDecimals('EURC')).toBe(7);
  });

  it('reconciles on-chain stroop units to accurate decimal floats and strings', () => {
    // 100 USDC in 7 decimals = 1,000,000,000 stroops
    const rawStroops = 1_000_000_000n;
    const reconciled = reconcileTokenUnits(rawStroops, 'USDC');

    expect(reconciled.normalized).toBe(100);
    expect(reconciled.decimalString).toBe('100');
    expect(reconciled.formattedWithSymbol).toBe('100 USDC');
    expect(reconciled.decimals).toBe(7);
  });

  it('reconciles fractional amounts with full precision without truncation', () => {
    // 12.3456789 XLM in 7 decimals = 123456789 stroops
    const rawStroops = 123456789n;
    const reconciled = reconcileTokenUnits(rawStroops, 'XLM');

    expect(reconciled.normalized).toBeCloseTo(12.3456789, 7);
    expect(reconciled.decimalString).toBe('12.3456789');
    expect(reconciled.formattedWithSymbol).toContain('12.3456 XLM');
  });

  it('handles negative balances correctly', () => {
    const rawStroops = -50_000_000n; // -5 USDC
    const reconciled = reconcileTokenUnits(rawStroops, 'USDC');

    expect(reconciled.normalized).toBe(-5);
    expect(reconciled.decimalString).toBe('-5');
    expect(reconciled.formattedWithSymbol).toContain('-5 USDC');
  });

  it('reconciles string and number inputs defensively', () => {
    const strRes = reconcileTokenUnits('250000000', 'USDC');
    expect(strRes.normalized).toBe(25);

    const numRes = reconcileTokenUnits(50000000, 'USDC');
    expect(numRes.normalized).toBe(5);

    const zeroRes = reconcileTokenUnits(0, 'USDC');
    expect(zeroRes.normalized).toBe(0);
    expect(zeroRes.decimalString).toBe('0');
  });
});
