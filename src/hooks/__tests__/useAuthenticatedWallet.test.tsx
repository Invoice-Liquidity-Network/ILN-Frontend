import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthenticatedWallet } from '../useAuthenticatedWallet';
import { WalletProvider } from '@/context/WalletContext';
import * as freighterApi from '@stellar/freighter-api';

// Mock Freighter API
vi.mock('@stellar/freighter-api');

// WalletProvider surfaces connection errors through the toast context.
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn(() => 'toast-id'), updateToast: vi.fn() }),
}));

// Mock fetch API. This has to be (re)assigned per test: the MSW server started
// in vitest.setup.ts patches globalThis.fetch in its own beforeAll hook, which
// runs after this module is evaluated.

const MOCK_PUBLIC_KEY = 'GBZXN7PIRZGNMHGA7MUSC23TFSQ55TWREN3QQR5UELWXONE4O36XL7QP';
const MOCK_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50IjoiR0JaWE43UElSWkdOTUhHQTdNVVNDMjNURlNRNTVUV1JFTjNRUVI1VUVMVlhPTkU0TzM2WEw3UVAiLCJpYXQiOjE2ODk5NzE2MDAsImV4cCI6MTY5MDA1ODAwMH0.test';
const MOCK_CHALLENGE_XDR = 'AAAAAgAAAAA...'; // Simplified mock XDR
const MOCK_SIGNED_CHALLENGE_XDR = 'AAAAAwAAAAA...'; // Simplified mock signed XDR

describe('useAuthenticatedWallet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WalletProvider>{children}</WalletProvider>
  );

  describe('Initial State', () => {
    it('should return disconnected state initially', () => {
      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.publicKey).toBeNull();
      expect(result.current.jwt).toBeNull();
    });

    it('should throw error when used outside WalletProvider', () => {
      expect(() => {
        renderHook(() => useAuthenticatedWallet());
      }).toThrow('useAuthenticatedWallet must be used within a WalletProvider');
    });
  });

  describe('Connection Flow', () => {
    it('should expose connect, disconnect, and signTransaction methods', () => {
      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.signTransaction).toBe('function');
    });

    it('opens provider selection on connect without performing SEP-10 yet', async () => {
      // WalletContext.connect() now only opens the wallet-provider selection
      // modal; the Freighter handshake (and therefore the SEP-10 exchange) runs
      // from the modal, not from this hook.
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({ address: MOCK_PUBLIC_KEY });

      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/challenge'),
        expect.anything()
      );
      expect(result.current.jwt).toBeNull();
    });
  });

  describe('Disconnect', () => {
    it('should clear JWT and connection state on disconnect', async () => {
      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.jwt).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('JWT Storage', () => {
    it('should never write the JWT to localStorage', async () => {
      const localStorageSpy = vi.spyOn(window.localStorage, 'setItem');

      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({ address: MOCK_PUBLIC_KEY });

      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      const jwtSetItemCalls = localStorageSpy.mock.calls.filter((call) =>
        String(call[0]).includes('jwt')
      );
      expect(jwtSetItemCalls).toHaveLength(0);

      localStorageSpy.mockRestore();
    });
  });

  describe('Public Key Exposure', () => {
    it("should expose connected wallet's public key", async () => {
      // Mock Freighter connection
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({
        address: MOCK_PUBLIC_KEY,
      });

      // Mock SEP-10 endpoints
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/challenge')) {
          return Promise.resolve(
            new Response(JSON.stringify({ challenge: MOCK_CHALLENGE_XDR }), {
              status: 200,
            })
          );
        }
        if (url.includes('/api/auth/verify')) {
          return Promise.resolve(
            new Response(JSON.stringify({ token: MOCK_JWT_TOKEN }), {
              status: 200,
            })
          );
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      (freighterApi.signTransaction as any).mockResolvedValue(MOCK_SIGNED_CHALLENGE_XDR);

      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.publicKey).toBe(MOCK_PUBLIC_KEY);
      });
    });
  });

  describe('Error Handling', () => {
    it('leaves the JWT null when the SEP-10 endpoints are failing', async () => {
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({
        address: MOCK_PUBLIC_KEY,
      });

      // Mock SEP-10 challenge endpoint to fail
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/challenge')) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: 'Failed' }), { status: 500 })
          );
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      // JWT should remain null on error
      expect(result.current.jwt).toBeNull();
    });

    it('should throw error when signTransaction is called while disconnected', async () => {
      const { result } = renderHook(() => useAuthenticatedWallet(), { wrapper });

      await expect(
        act(async () => {
          await result.current.signTransaction('test-xdr');
        })
      ).rejects.toThrow('Wallet is not connected');
    });
  });
});
