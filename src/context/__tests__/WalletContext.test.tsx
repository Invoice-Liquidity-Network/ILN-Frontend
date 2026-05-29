import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAddress, getNetwork, isConnected, setAllowed } from "@stellar/freighter-api";
import { WalletProvider, useWallet } from "../WalletContext";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  setAllowed: vi.fn(),
  signTransaction: vi.fn(),
  getNetwork: vi.fn(),
}));

vi.mock("../ToastContext", () => ({
  useToast: () => ({
    addToast: vi.fn(() => "toast-id"),
    updateToast: vi.fn(),
  }),
}));

const ADDRESS = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6";
const ADDRESS_KEY = "iln_wallet_address";
const PROVIDER_KEY = "iln_wallet_provider";

function WalletProbe() {
  const wallet = useWallet();

  return (
    <div>
      <span data-testid="address">{wallet.address ?? "none"}</span>
      <span data-testid="connected">{String(wallet.isConnected)}</span>
      <span data-testid="reconnecting">{String(wallet.isReconnecting)}</span>
      <button onClick={wallet.connect}>connect</button>
      <button onClick={wallet.disconnect}>disconnect</button>
    </div>
  );
}

function renderWallet() {
  return render(
    <WalletProvider>
      <WalletProbe />
    </WalletProvider>,
  );
}

describe("WalletProvider auto-reconnect", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(getAddress).mockResolvedValue({ address: ADDRESS });
    vi.mocked(getNetwork).mockResolvedValue({ network: "TESTNET" });
    vi.mocked(setAllowed).mockResolvedValue({ isAllowed: true });
  });

  it("silently reconnects when a Freighter preference exists", async () => {
    localStorage.setItem(PROVIDER_KEY, "freighter");

    renderWallet();

    await waitFor(() => expect(screen.getByTestId("address")).toHaveTextContent(ADDRESS));
    expect(screen.getByTestId("connected")).toHaveTextContent("true");
    expect(localStorage.getItem(ADDRESS_KEY)).toBe(ADDRESS);
    expect(localStorage.getItem(PROVIDER_KEY)).toBe("freighter");
  });

  it("clears the stored preference when silent reconnect fails", async () => {
    localStorage.setItem(PROVIDER_KEY, "freighter");
    localStorage.setItem(ADDRESS_KEY, ADDRESS);
    vi.mocked(getAddress).mockResolvedValue({ address: null });

    renderWallet();

    await waitFor(() => expect(localStorage.getItem(PROVIDER_KEY)).toBeNull());
    expect(localStorage.getItem(ADDRESS_KEY)).toBeNull();
    expect(screen.getByTestId("address")).toHaveTextContent("none");
    expect(screen.getByTestId("connected")).toHaveTextContent("false");
  });

  it("stores the provider after an explicit successful connection", async () => {
    renderWallet();

    fireEvent.click(screen.getByRole("button", { name: "connect" }));

    await waitFor(() => expect(localStorage.getItem(PROVIDER_KEY)).toBe("freighter"));
    expect(localStorage.getItem(ADDRESS_KEY)).toBe(ADDRESS);
  });

  it("clears the provider preference on disconnect", async () => {
    localStorage.setItem(PROVIDER_KEY, "freighter");
    localStorage.setItem(ADDRESS_KEY, ADDRESS);

    renderWallet();
    await waitFor(() => expect(screen.getByTestId("connected")).toHaveTextContent("true"));

    fireEvent.click(screen.getByRole("button", { name: "disconnect" }));

    expect(localStorage.getItem(PROVIDER_KEY)).toBeNull();
    expect(localStorage.getItem(ADDRESS_KEY)).toBeNull();
    expect(screen.getByTestId("connected")).toHaveTextContent("false");
  });
});
