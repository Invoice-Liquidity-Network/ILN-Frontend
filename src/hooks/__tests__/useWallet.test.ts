import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWallet } from "../useWallet";
import { WalletProvider } from "@/context/WalletContext";
import * as freighterApi from "@stellar/freighter-api";

// Mock Freighter API
vi.mock("@stellar/freighter-api");

// Mock fetch API
global.fetch = vi.fn();

const MOCK_PUBLIC_KEY = "GBZXN7PIRZGNMHGA7MUSC23TFSQ55TWREN3QQR5UELWXONE4O36XL7QP";
const MOCK_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50IjoiR0JaWE43UElSWkdOTUhHQTdNVVNDMjNURlNRNTVUV1JFTjNRUVI1VUVMVlhPTkU0TzM2WEw3UVAiLCJpYXQiOjE2ODk5NzE2MDAsImV4cCI6MTY5MDA1ODAwMH0.test";
const MOCK_CHALLENGE_XDR =
  "AAAAAgAAAAA..."; // Simplified mock XDR
const MOCK_SIGNED_CHALLENGE_XDR =
  "AAAAAwAAAAA..."; // Simplified mock signed XDR

describe("useWallet Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WalletProvider>{children}</WalletProvider>
  );

  describe("Initial State", () => {
    it("should return disconnected state initially", () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.publicKey).toBeNull();
      expect(result.current.jwt).toBeNull();
    });

    it("should throw error when used outside WalletProvider", () => {
      expect(() => {
        renderHook(() => useWallet());
      }).toThrow("useWallet must be used within a WalletProvider");
    });
  });

  describe("Connection Flow", () => {
    it("should expose connect, disconnect, and signTransaction methods", () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.connect).toBe("function");
      expect(typeof result.current.disconnect).toBe("function");
      expect(typeof result.current.signTransaction).toBe("function");
    });

    it("should handle SEP-10 challenge/verify on connect", async () => {
      // Mock Freighter connection
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({
        address: MOCK_PUBLIC_KEY,
      });

      // Mock SEP-10 challenge endpoint
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/auth/challenge")) {
          return Promise.resolve(
            new Response(JSON.stringify({ challenge: MOCK_CHALLENGE_XDR }), {
              status: 200,
            }),
          );
        }
        if (url.includes("/api/auth/verify")) {
          return Promise.resolve(
            new Response(JSON.stringify({ token: MOCK_JWT_TOKEN }), {
              status: 200,
            }),
          );
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      // Mock wallet signing
      (freighterApi.signTransaction as any).mockResolvedValue(
        MOCK_SIGNED_CHALLENGE_XDR,
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      // Verify SEP-10 flow was triggered
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/auth/challenge"),
          expect.anything(),
        );
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/auth/verify",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        );
      });

      // JWT should be stored in memory
      await waitFor(() => {
        expect(result.current.jwt).toBe(MOCK_JWT_TOKEN);
      });
    });
  });

  describe("Disconnect", () => {
    it("should clear JWT on disconnect", async () => {
      // Mock Freighter connection
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({
        address: MOCK_PUBLIC_KEY,
      });

      // Mock SEP-10 endpoints
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/auth/challenge")) {
          return Promise.resolve(
            new Response(JSON.stringify({ challenge: MOCK_CHALLENGE_XDR }), {
              status: 200,
            }),
          );
        }
        if (url.includes("/api/auth/verify")) {
          return Promise.resolve(
            new Response(JSON.stringify({ token: MOCK_JWT_TOKEN }), {
              status: 200,
            }),
          );
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      (freighterApi.signTransaction as any).mockResolvedValue(
        MOCK_SIGNED_CHALLENGE_XDR,
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Connect first
      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.jwt).toBe(MOCK_JWT_TOKEN);
      });

      // Now disconnect
      act(() => {
        result.current.disconnect();
      });

      // JWT should be cleared
      expect(result.current.jwt).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("JWT Storage", () => {
    it("should store JWT in memory, not localStorage", async () => {
      const localStorageSpy = vi.spyOn(window.localStorage, "setItem");

      // Mock Freighter connection
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({
        address: MOCK_PUBLIC_KEY,
      });

      // Mock SEP-10 endpoints
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/auth/challenge")) {
          return Promise.resolve(
            new Response(JSON.stringify({ challenge: MOCK_CHALLENGE_XDR }), {
              status: 200,
            }),
          );
        }
        if (url.includes("/api/auth/verify")) {
          return Promise.resolve(
            new Response(JSON.stringify({ token: MOCK_JWT_TOKEN }), {
              status: 200,
            }),
          );
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      (freighterApi.signTransaction as any).mockResolvedValue(
        MOCK_SIGNED_CHALLENGE_XDR,
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.jwt).toBe(MOCK_JWT_TOKEN);
      });

      // localStorage should not be called for JWT storage
      // (it may be called for other things, but not for the JWT itself)
      const jwtSetItemCalls = localStorageSpy.mock.calls.filter((call) =>
        call[0].includes("jwt"),
      );
      expect(jwtSetItemCalls).toHaveLength(0);

      localStorageSpy.mockRestore();
    });
  });

  describe("Public Key Exposure", () => {
    it("should expose connected wallet's public key", async () => {
      // Mock Freighter connection
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({
        address: MOCK_PUBLIC_KEY,
      });

      // Mock SEP-10 endpoints
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/auth/challenge")) {
          return Promise.resolve(
            new Response(JSON.stringify({ challenge: MOCK_CHALLENGE_XDR }), {
              status: 200,
            }),
          );
        }
        if (url.includes("/api/auth/verify")) {
          return Promise.resolve(
            new Response(JSON.stringify({ token: MOCK_JWT_TOKEN }), {
              status: 200,
            }),
          );
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      (freighterApi.signTransaction as any).mockResolvedValue(
        MOCK_SIGNED_CHALLENGE_XDR,
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.publicKey).toBe(MOCK_PUBLIC_KEY);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle SEP-10 challenge fetch error", async () => {
      // Mock Freighter connection
      (freighterApi.isConnected as any).mockResolvedValue(true);
      (freighterApi.setAllowed as any).mockResolvedValue(true);
      (freighterApi.getAddress as any).mockResolvedValue({
        address: MOCK_PUBLIC_KEY,
      });

      // Mock SEP-10 challenge endpoint to fail
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/auth/challenge")) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Failed" }), { status: 500 }),
          );
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useWallet(), { wrapper });

      await expect(
        act(async () => {
          await result.current.connect();
        }),
      ).rejects.toThrow();

      // JWT should remain null on error
      expect(result.current.jwt).toBeNull();
    });

    it("should throw error when signTransaction is called while disconnected", async () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      await expect(
        act(async () => {
          await result.current.signTransaction("test-xdr");
        }),
      ).rejects.toThrow("Wallet is not connected");
    });
  });
});
