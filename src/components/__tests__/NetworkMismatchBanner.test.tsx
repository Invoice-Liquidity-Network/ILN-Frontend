import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NetworkMismatchBanner from "../NetworkMismatchBanner";

const walletState = {
  isConnected: false,
  networkMismatch: false,
};

vi.mock("../../context/WalletContext", () => ({
  useWallet: () => walletState,
}));

describe("NetworkMismatchBanner", () => {
  beforeEach(() => {
    walletState.isConnected = false;
    walletState.networkMismatch = false;
  });

  it("does not render when the wallet is disconnected", () => {
    walletState.networkMismatch = true;

    render(<NetworkMismatchBanner />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not render when the connected wallet is on the expected network", () => {
    walletState.isConnected = true;

    render(<NetworkMismatchBanner />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders a global warning when the connected wallet network does not match", () => {
    walletState.isConnected = true;
    walletState.networkMismatch = true;

    render(<NetworkMismatchBanner />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Wallet network mismatch")).toBeInTheDocument();
    expect(screen.getByText(/Switch your wallet to TESTNET/i)).toBeInTheDocument();
    expect(screen.getByText(/transaction actions may fail/i)).toBeInTheDocument();
  });
});
