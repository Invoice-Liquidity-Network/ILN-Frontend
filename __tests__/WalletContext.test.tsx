import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../src/context/ToastContext";
import { WalletProvider, useWallet } from "../src/context/WalletContext";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn().mockResolvedValue(false),
  getAddress: vi.fn().mockResolvedValue({ address: null }),
  setAllowed: vi.fn().mockResolvedValue(false),
  signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: "signed-xdr" }),
  getNetwork: vi.fn().mockResolvedValue({ network: "TESTNET" }),
}));

function DisconnectHarness() {
  const { disconnect } = useWallet();
  return <button onClick={disconnect}>Disconnect</button>;
}

describe("WalletProvider disconnect", () => {
  const queryClient = {
    clear: vi.fn(),
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  };
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(useQueryClient).mockReturnValue(queryClient as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
  });

  it("clears wallet-scoped storage, resets cached query data, redirects home, and confirms disconnect", async () => {
    localStorage.setItem("iln_wallet_address", "GABC");
    localStorage.setItem("watchlist_GABC", "[\"1\"]");
    localStorage.setItem("iln-address-book-GABC", "[]");
    localStorage.setItem("iln_onboarding_completed_GABC", "true");
    localStorage.setItem("freelancer_view_mode", "table");
    localStorage.setItem("theme", "dark");

    render(
      <ToastProvider>
        <WalletProvider>
          <DisconnectHarness />
        </WalletProvider>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));

    expect(localStorage.getItem("iln_wallet_address")).toBeNull();
    expect(localStorage.getItem("watchlist_GABC")).toBeNull();
    expect(localStorage.getItem("iln-address-book-GABC")).toBeNull();
    expect(localStorage.getItem("iln_onboarding_completed_GABC")).toBeNull();
    expect(localStorage.getItem("freelancer_view_mode")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(queryClient.clear).toHaveBeenCalledOnce();
    expect(router.push).toHaveBeenCalledWith("/");

    await waitFor(() => expect(screen.getByText("Disconnected")).toBeInTheDocument());
    expect(screen.getByText("Wallet session data has been cleared.")).toBeInTheDocument();
  });
});
