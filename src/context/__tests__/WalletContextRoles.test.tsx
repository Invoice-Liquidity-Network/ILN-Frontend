import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAddress, getNetwork, isConnected } from "@stellar/freighter-api";
import { WalletProvider, useWallet } from "../WalletContext";
import { getAllInvoices } from "@/utils/soroban";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  setAllowed: vi.fn(),
  signTransaction: vi.fn(),
  getNetwork: vi.fn(),
}));

vi.mock("@/utils/soroban", () => ({
  getAllInvoices: vi.fn(),
}));

vi.mock("../ToastContext", () => ({
  useToast: () => ({
    addToast: vi.fn(() => "toast-id"),
    updateToast: vi.fn(),
  }),
}));

const ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const OTHER = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

function WalletProbe() {
  const wallet = useWallet();

  return (
    <div>
      <span data-testid="address">{wallet.address ?? "none"}</span>
      <span data-testid="roles">{wallet.roles.join(",") || "none"}</span>
      <span data-testid="loading">{String(wallet.rolesLoading)}</span>
      <span data-testid="submitted">{wallet.roleSummary.submittedCount}</span>
      <span data-testid="payer">{wallet.roleSummary.payerCount}</span>
      <span data-testid="funded">{wallet.roleSummary.fundedCount}</span>
    </div>
  );
}

describe("WalletProvider role detection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(getAddress).mockResolvedValue({ address: ADDRESS });
    vi.mocked(getNetwork).mockResolvedValue({ network: "TESTNET" });
    vi.mocked(getAllInvoices).mockResolvedValue([
      {
        id: 1n,
        status: "Pending",
        freelancer: ADDRESS,
        payer: OTHER,
        amount: 100n,
        due_date: 1n,
        discount_rate: 300,
      },
      {
        id: 2n,
        status: "Funded",
        freelancer: OTHER,
        payer: ADDRESS,
        amount: 200n,
        due_date: 2n,
        discount_rate: 300,
        funder: ADDRESS,
      },
    ]);
  });

  it("detects roles after restoring a saved wallet connection", async () => {
    localStorage.setItem("iln_wallet_address", ADDRESS);

    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("address")).toHaveTextContent(ADDRESS));
    await waitFor(() => expect(screen.getByTestId("roles")).toHaveTextContent("freelancer,payer,lp"));
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("submitted")).toHaveTextContent("1");
    expect(screen.getByTestId("payer")).toHaveTextContent("1");
    expect(screen.getByTestId("funded")).toHaveTextContent("1");
  });
});

