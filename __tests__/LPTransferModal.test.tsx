import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockExecute = vi.fn();

vi.mock("@/hooks/useTransaction", () => ({
  useTransaction: () => ({ execute: mockExecute, loading: false, error: null }),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GSELF000000000000000000000000000000000000000000000000000000" }),
}));

vi.mock("@stellar/stellar-sdk", () => ({
  TransactionBuilder: vi.fn(),
  Operation: { invokeContractFunction: vi.fn() },
  Address: { fromString: vi.fn(() => ({ toScVal: vi.fn() })) },
  nativeToScVal: vi.fn(),
  BASE_FEE: "100",
  rpc: {
    Server: vi.fn(() => ({
      getAccount: vi.fn().mockResolvedValue({}),
      simulateTransaction: vi.fn().mockResolvedValue({ result: {} }),
    })),
    Api: { isSimulationSuccess: vi.fn(() => true) },
    assembleTransaction: vi.fn(() => ({ build: vi.fn(() => "assembled-tx") })),
  },
}));

vi.mock("@/constants", () => ({
  CONTRACT_ID: "CTEST",
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  RPC_URL: "https://soroban-testnet.stellar.org",
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import LPTransferModal from "@/components/LPTransferModal";
import type { Invoice } from "@/utils/soroban";

const VALID_RECIPIENT = "GRECIPIENT0000000000000000000000000000000000000000000000000";
const SELF_ADDRESS = "GSELF000000000000000000000000000000000000000000000000000000";

const invoice: Invoice = {
  id: 42n,
  freelancer: "GFR1",
  payer: "GPAYER1",
  amount: 5_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 300,
  status: "Funded",
  funder: SELF_ADDRESS,
};

function renderModal(onSuccess = vi.fn(), onClose = vi.fn()) {
  return render(
    <LPTransferModal invoice={invoice} onClose={onClose} onSuccess={onSuccess} />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LPTransferModal", () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it("renders the modal with invoice id and ownership warning", () => {
    renderModal();
    expect(screen.getByText(/Transfer LP Position #42/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently reassigns payout ownership/i)).toBeInTheDocument();
  });

  it("shows a validation error when the address field is empty", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /Transfer Position/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/required/i);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid G-address", async () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText("G..."), { target: { value: "NOTVALID" } });
    fireEvent.click(screen.getByRole("button", { name: /Transfer Position/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid Stellar G-address/i);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("prevents self-transfer", async () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText("G..."), { target: { value: SELF_ADDRESS } });
    fireEvent.click(screen.getByRole("button", { name: /Transfer Position/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot transfer.*yourself/i);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("calls execute and invokes onSuccess with a valid address", async () => {
    mockExecute.mockResolvedValue("tx-hash-abc");
    const onSuccess = vi.fn();
    renderModal(onSuccess);

    fireEvent.change(screen.getByPlaceholderText("G..."), { target: { value: VALID_RECIPIENT } });
    fireEvent.click(screen.getByRole("button", { name: /Transfer Position/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith(invoice, VALID_RECIPIENT);
  });

  it("does not call onSuccess when execute returns null (user rejected)", async () => {
    mockExecute.mockResolvedValue(null);
    const onSuccess = vi.fn();
    renderModal(onSuccess);

    fireEvent.change(screen.getByPlaceholderText("G..."), { target: { value: VALID_RECIPIENT } });
    fireEvent.click(screen.getByRole("button", { name: /Transfer Position/i }));

    await waitFor(() => expect(mockExecute).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    renderModal(vi.fn(), onClose);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
