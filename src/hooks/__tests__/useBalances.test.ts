import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBalances } from "../useBalances";
import type { ApprovedToken } from "../useApprovedTokens";

vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(),
}));
vi.mock("@/utils/soroban", () => ({
  getTokenBalance: vi.fn(),
}));

import { useWallet } from "@/context/WalletContext";
import { getTokenBalance } from "@/utils/soroban";

const mockTokens: ApprovedToken[] = [
  { contractId: "CONTRACT_A", symbol: "USDC", decimals: 7, isAllowed: true },
  { contractId: "CONTRACT_B", symbol: "XLM", decimals: 7, isAllowed: true },
  { contractId: "CONTRACT_C", symbol: "NOPE", decimals: 7, isAllowed: false },
];

function connectedWallet() {
  vi.mocked(useWallet).mockReturnValue({
    address: "GTEST123",
    isConnected: true,
    networkMismatch: false,
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBalances", () => {
  it("returns empty balances and no loading when wallet not connected", () => {
    vi.mocked(useWallet).mockReturnValue({ address: null, isConnected: false, networkMismatch: false } as any);
    const { result } = renderHook(() => useBalances(mockTokens));
    expect(result.current.balances.size).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns empty balances when network mismatch", () => {
    vi.mocked(useWallet).mockReturnValue({ address: "G123", isConnected: true, networkMismatch: true } as any);
    const { result } = renderHook(() => useBalances(mockTokens));
    expect(result.current.balances.size).toBe(0);
  });

  it("fetches balances for allowed tokens only", async () => {
    connectedWallet();
    vi.mocked(getTokenBalance)
      .mockResolvedValueOnce(1000n)
      .mockResolvedValueOnce(2000n);

    const { result } = renderHook(() => useBalances(mockTokens));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getTokenBalance).toHaveBeenCalledTimes(2);
    expect(result.current.balances.get("CONTRACT_A")).toBe(1000n);
    expect(result.current.balances.get("CONTRACT_B")).toBe(2000n);
    expect(result.current.balances.has("CONTRACT_C")).toBe(false);
  });

  it("handles partial failures gracefully", async () => {
    connectedWallet();
    vi.mocked(getTokenBalance)
      .mockResolvedValueOnce(500n)
      .mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useBalances(mockTokens));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.balances.get("CONTRACT_A")).toBe(500n);
    expect(result.current.balances.has("CONTRACT_B")).toBe(false);
  });

  it("skips fetching when disabled", () => {
    connectedWallet();
    const { result } = renderHook(() => useBalances(mockTokens, false));
    expect(getTokenBalance).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
