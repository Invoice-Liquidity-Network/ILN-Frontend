import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FaucetButton from "../FaucetButton";

const addToast = vi.fn();
const walletState = {
  address: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6",
  isConnected: true,
};

vi.mock("../../context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("../../context/ToastContext", () => ({
  useToast: () => ({ addToast }),
}));

describe("FaucetButton", () => {
  beforeEach(() => {
    addToast.mockReset();
    walletState.address = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6";
    walletState.isConnected = true;
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
    global.fetch = vi.fn();
  });

  it("does not render when the wallet is disconnected", () => {
    walletState.isConnected = false;

    render(<FaucetButton />);

    expect(screen.queryByRole("button", { name: /get testnet xlm/i })).not.toBeInTheDocument();
  });

  it("does not render on mainnet builds", () => {
    vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");

    render(<FaucetButton />);

    expect(screen.queryByRole("button", { name: /get testnet xlm/i })).not.toBeInTheDocument();
  });

  it("requests Friendbot funding when the connected wallet has insufficient XLM", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ balances: [{ asset_type: "native", balance: "0.25" }] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ balances: [{ asset_type: "native", balance: "10000.00" }] }),
      } as Response);

    render(<FaucetButton />);

    const button = await screen.findByRole("button", { name: /get testnet xlm/i });
    expect(screen.getByText("0.25 XLM available")).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "https://friendbot.stellar.org?addr=GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6",
      ),
    );
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Testnet XLM funded" }),
    );
    await waitFor(() => expect(screen.getByText("10000.00 XLM available")).toBeInTheDocument());
  });

  it("disables funding when the connected wallet already has enough XLM", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ balances: [{ asset_type: "native", balance: "2.50" }] }),
    } as Response);

    render(<FaucetButton />);

    const button = await screen.findByRole("button", { name: /xlm funded/i });
    expect(button).toBeDisabled();
    expect(screen.getByText("2.50 XLM available")).toBeInTheDocument();
  });

  it("shows an error toast when Friendbot rejects the request", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ balances: [{ asset_type: "native", balance: "0" }] }),
      } as Response)
      .mockResolvedValueOnce({ ok: false, status: 429 } as Response);

    render(<FaucetButton />);

    fireEvent.click(await screen.findByRole("button", { name: /get testnet xlm/i }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Faucet request failed" }),
      ),
    );
  });
});
