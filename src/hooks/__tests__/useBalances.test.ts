import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBalances } from "../useBalances";
import { notifyWalletBalancesChanged } from "@/utils/balanceRefresh";

const TOKENS = [
  { contractId: "USDC_TOKEN", decimals: 7, iconLabel: "US", name: "USD Coin", symbol: "USDC" },
  { contractId: "EURC_TOKEN", decimals: 7, iconLabel: "EU", name: "Euro Coin", symbol: "EURC" },
  { contractId: "native", decimals: 7, iconLabel: "XL", name: "Stellar Lumens", symbol: "XLM" },
];

describe("useBalances", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          balances: [
            { asset_code: "USDC", asset_type: "credit_alphanum4", balance: "1.0000000" },
            { asset_code: "EURC", asset_type: "credit_alphanum4", balance: "3.5000000" },
            { asset_type: "native", balance: "2.0000000" },
          ],
        }),
    } as Response);
  });

  it("loads token balances and native XLM for the connected wallet", async () => {
    const { result } = renderHook(() =>
      useBalances({ address: "GACCOUNT", enabled: true, tokens: TOKENS }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.balances).toHaveLength(3);
    expect(result.current.balances.find((balance) => balance.token.symbol === "USDC")?.amount).toBe(10_000_000n);
    expect(result.current.balances.find((balance) => balance.token.symbol === "EURC")?.amount).toBe(35_000_000n);
    expect(result.current.balances.find((balance) => balance.token.symbol === "XLM")?.amount).toBe(20_000_000n);
  });

  it("registers 30-second balance polling", () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    renderHook(() => useBalances({ address: "GACCOUNT", enabled: true, tokens: TOKENS }));

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);
    setIntervalSpy.mockRestore();
  });

  it("refreshes when a successful transaction announces balance changes", async () => {
    renderHook(() => useBalances({ address: "GACCOUNT", enabled: true, tokens: TOKENS }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    act(() => {
      notifyWalletBalancesChanged();
    });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("marks missing non-native trustlines as zero-balance add-trustline rows", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ balances: [{ asset_type: "native", balance: "2.0000000" }] }),
    } as Response);

    const { result } = renderHook(() =>
      useBalances({ address: "GACCOUNT", enabled: true, tokens: TOKENS }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const usdc = result.current.balances.find((balance) => balance.token.symbol === "USDC");

    expect(usdc?.amount).toBe(0n);
    expect(usdc?.hasTrustline).toBe(false);
  });
});
