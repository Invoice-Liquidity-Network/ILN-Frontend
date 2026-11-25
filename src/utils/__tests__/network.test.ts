import { describe, expect, it, vi } from 'vitest';

vi.mock('@/constants', () => ({
  STELLAR_NETWORK: 'testnet',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  NETWORK_NAME: 'TESTNET',
}));

import {
  checkRpcMismatch,
  formatNetworkLabel,
  getConfiguredStellarNetwork,
  getMismatchDetails,
  getRpcNetworkFromUrl,
  networksMatch,
  normalizeWalletNetwork,
} from '../network';

describe('network normalization (#1295)', () => {
  describe('normalizeWalletNetwork', () => {
    it.each([
      'PUBLIC',
      'public',
      'PUBNET',
      'MAINNET',
      'MAIN',
      '  mainnet  ',
      'stellar:pubnet',
      'Public Global Stellar Network ; September 2015',
    ])('normalizes mainnet identifier %j to "mainnet"', (input) => {
      expect(normalizeWalletNetwork(input)).toBe('mainnet');
    });

    it.each([
      'TESTNET',
      'testnet',
      'TEST',
      '  test  ',
      'stellar:testnet',
      'Test SDF Network ; September 2015',
    ])('normalizes testnet identifier %j to "testnet"', (input) => {
      expect(normalizeWalletNetwork(input)).toBe('testnet');
    });

    it.each([
      'FUTURENET',
      'futurenet',
      'stellar:futurenet',
      'Test SDF Future Network ; October 2022',
    ])('normalizes futurenet identifier %j to "futurenet" rather than "testnet"', (input) => {
      expect(normalizeWalletNetwork(input)).toBe('futurenet');
    });

    it.each(['', '   ', '\t\n'])('normalizes blank value %j to "unknown"', (input) => {
      expect(normalizeWalletNetwork(input)).toBe('unknown');
    });

    it('normalizes non-string runtime values safely to "unknown"', () => {
      expect(normalizeWalletNetwork(undefined as unknown as string)).toBe('unknown');
      expect(normalizeWalletNetwork(null as unknown as string)).toBe('unknown');
    });

    it('preserves unrecognized non-empty values in lowercase without coercing to testnet/mainnet', () => {
      expect(normalizeWalletNetwork('STANDALONE')).toBe('standalone');
      expect(normalizeWalletNetwork('  CustomNet  ')).toBe('customnet');
    });
  });

  describe('networksMatch', () => {
    it('matches equivalent mainnet and testnet identifiers across wallets', () => {
      expect(networksMatch('PUBLIC', 'mainnet')).toBe(true);
      expect(networksMatch('stellar:pubnet', 'PUBLIC')).toBe(true);
      expect(networksMatch('TESTNET', 'testnet')).toBe(true);
      expect(networksMatch('Test SDF Network ; September 2015', 'TEST')).toBe(true);
    });

    it('fails closed when comparing testnet against mainnet or futurenet', () => {
      expect(networksMatch('PUBLIC', 'testnet')).toBe(false);
      expect(networksMatch('TESTNET', 'mainnet')).toBe(false);
      expect(networksMatch('FUTURENET', 'testnet')).toBe(false);
    });

    it('fails safely on unknown or empty values even if both sides match', () => {
      expect(networksMatch('', 'testnet')).toBe(false);
      expect(networksMatch('', '')).toBe(false);
      expect(networksMatch('unknown', 'unknown')).toBe(false);
      expect(networksMatch('standalone', 'standalone')).toBe(false);
      expect(networksMatch('futurenet', 'futurenet')).toBe(false);
    });

    it('uses the configured Stellar network by default', () => {
      expect(getConfiguredStellarNetwork()).toBe('testnet');
      expect(networksMatch('TESTNET')).toBe(true);
      expect(networksMatch('PUBLIC')).toBe(false);
    });
  });

  describe('formatNetworkLabel', () => {
    it('formats known networks cleanly', () => {
      expect(formatNetworkLabel('PUBLIC')).toBe('Mainnet');
      expect(formatNetworkLabel('TESTNET')).toBe('Testnet');
      expect(formatNetworkLabel('FUTURENET')).toBe('Futurenet');
    });

    it('returns "Unknown" instead of mislabeling unrecognized networks as Testnet', () => {
      expect(formatNetworkLabel('')).toBe('Unknown');
      expect(formatNetworkLabel('unknown')).toBe('Unknown');
      expect(formatNetworkLabel('standalone')).toBe('Unknown');
    });
  });

  describe('RPC and mismatch details', () => {
    it('identifies known testnet and mainnet RPC URLs and returns null for custom URLs', () => {
      expect(getRpcNetworkFromUrl('https://soroban-testnet.stellar.org')).toBe('testnet');
      expect(getRpcNetworkFromUrl('https://rpc.stellar.org')).toBe('mainnet');
      expect(getRpcNetworkFromUrl('https://custom-rpc.example.com')).toBeNull();
      expect(getRpcNetworkFromUrl('   ')).toBeNull();
    });

    it('detects RPC mismatch for mismatched or unknown wallet networks', () => {
      expect(checkRpcMismatch('https://soroban-testnet.stellar.org', 'TESTNET')).toBe(false);
      expect(checkRpcMismatch('https://soroban-testnet.stellar.org', 'PUBLIC')).toBe(true);
      expect(checkRpcMismatch('https://soroban-testnet.stellar.org', 'FUTURENET')).toBe(true);
      expect(checkRpcMismatch('https://soroban-testnet.stellar.org', '')).toBe(true);
      expect(checkRpcMismatch('https://custom-rpc.example.com', 'PUBLIC')).toBe(false);
    });

    it('reports walletMismatch and rpcMismatch safely for unknown and futurenet wallets', () => {
      expect(getMismatchDetails('TESTNET')).toMatchObject({
        walletMismatch: false,
        rpcMismatch: false,
        walletNetwork: 'testnet',
        appNetwork: 'testnet',
      });

      expect(getMismatchDetails('FUTURENET')).toMatchObject({
        walletMismatch: true,
        rpcMismatch: true,
        walletNetwork: 'futurenet',
        appNetwork: 'testnet',
      });

      expect(getMismatchDetails('')).toMatchObject({
        walletMismatch: true,
        rpcMismatch: true,
        walletNetwork: 'unknown',
        appNetwork: 'testnet',
      });
    });
  });
});
