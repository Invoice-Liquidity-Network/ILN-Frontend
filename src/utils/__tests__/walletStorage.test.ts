import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearWalletStorage,
  getWalletStorageKey,
  getStoredWalletProvider,
  readWalletRecord,
  writeWalletRecord,
  WALLET_ADDRESS_STORAGE_KEY,
  WALLET_PROVIDER_STORAGE_KEY,
} from '../walletStorage';

describe('clearWalletStorage (#4)', () => {
  beforeEach(() => localStorage.clear());

  it('removes the stored address and wallet-scoped caches', () => {
    localStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, 'GTEST');
    localStorage.setItem('iln-address-book-GTEST', '[]');
    localStorage.setItem('iln-referral-7', 'CODE');
    localStorage.setItem('iln-watchlist', '[]');
    localStorage.setItem('freelancerInvoices.statuses', 'Paid');

    clearWalletStorage();

    expect(localStorage.getItem(WALLET_ADDRESS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('iln-address-book-GTEST')).toBeNull();
    expect(localStorage.getItem('iln-referral-7')).toBeNull();
    expect(localStorage.getItem('iln-watchlist')).toBeNull();
    expect(localStorage.getItem('freelancerInvoices.statuses')).toBeNull();
  });

  it('leaves unrelated keys untouched', () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('iln_wallet_address', 'GTEST');
    localStorage.setItem('iln_wallet_provider', 'walletconnect');

    clearWalletStorage();

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('iln_wallet_address')).toBeNull();
    expect(localStorage.getItem('iln_wallet_provider')).toBeNull();
  });

  it('returns the stored wallet provider when requested', () => {
    localStorage.setItem(WALLET_PROVIDER_STORAGE_KEY, 'walletconnect');
    expect(getStoredWalletProvider()).toBe('walletconnect');
  });
});

describe('scoped wallet records', () => {
  const wallet = 'GTEST';
  const scope = { origin: 'https://app.example', network: 'testnet' };

  beforeEach(() => localStorage.clear());

  it('round-trips an integrity-protected record', () => {
    expect(
      writeWalletRecord('address-book', wallet, [{ id: '1' }], { ...scope, now: 100 })
    ).toEqual({ ok: true });
    expect(readWalletRecord('address-book', wallet, { ...scope, now: 101 })).toEqual({
      status: 'found',
      value: [{ id: '1' }],
    });
  });

  it('detects modified records and removes them for safe recovery', () => {
    writeWalletRecord('address-book', wallet, [{ id: '1' }], { ...scope, now: 100 });
    const key = getWalletStorageKey('address-book', wallet, scope);
    const envelope = JSON.parse(localStorage.getItem(key)!);
    envelope.payload[0].id = 'attacker-change';
    localStorage.setItem(key, JSON.stringify(envelope));

    expect(readWalletRecord('address-book', wallet, { ...scope, now: 101 })).toEqual({
      status: 'recovered',
      error: 'INTEGRITY_FAILED',
    });
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('recovers deterministically from corrupt and expired records', () => {
    const key = getWalletStorageKey('address-book', wallet, scope);
    localStorage.setItem(key, '{bad json');
    expect(readWalletRecord('address-book', wallet, { ...scope, now: 101 })).toEqual({
      status: 'recovered',
      error: 'CORRUPT_DATA',
    });

    writeWalletRecord('address-book', wallet, [], { ...scope, now: 100, ttlMs: 10 });
    expect(readWalletRecord('address-book', wallet, { ...scope, now: 110 })).toEqual({
      status: 'recovered',
      error: 'EXPIRED',
    });
  });

  it('isolates records across wallets, networks, and origins', () => {
    writeWalletRecord('address-book', wallet, ['private'], { ...scope, now: 100 });
    expect(readWalletRecord('address-book', 'GOTHER', { ...scope, now: 101 })).toEqual({
      status: 'missing',
    });
    expect(
      readWalletRecord('address-book', wallet, { ...scope, network: 'mainnet', now: 101 })
    ).toEqual({
      status: 'missing',
    });
    expect(
      readWalletRecord('address-book', wallet, {
        ...scope,
        origin: 'https://other.example',
        now: 101,
      })
    ).toEqual({ status: 'missing' });
  });

  it('rejects a validly signed envelope copied into another wallet namespace', () => {
    writeWalletRecord('address-book', wallet, [], { ...scope, now: 100 });
    const source = getWalletStorageKey('address-book', wallet, scope);
    const target = getWalletStorageKey('address-book', 'GOTHER', scope);
    localStorage.setItem(target, localStorage.getItem(source)!);

    expect(readWalletRecord('address-book', 'GOTHER', { ...scope, now: 101 })).toEqual({
      status: 'recovered',
      error: 'SCOPE_MISMATCH',
    });
  });
});
