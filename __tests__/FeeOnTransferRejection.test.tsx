import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GABC", isConnected: true }),
}));
vi.mock("@/hooks/useTransaction", () => ({
  useTransaction: () => ({ execute: vi.fn(), loading: false, error: null }),
}));
vi.mock("@/utils/governance", () => ({
  fetchProtocolParameters: vi.fn().mockResolvedValue({
    feeRateBps: 30,
    maxDiscountRateBps: 500,
    acceptedTokens: [],
  }),
  createProposal: vi.fn(),
  isValidStellarAddress: (v: string) => v.length === 56,
  lookupToken: vi.fn(),
}));

import NewGovernanceProposalPage from "@/app/governance/new/page";
import { lookupToken } from "@/utils/governance";

const VALID_ADDR = "G" + "A".repeat(55);

describe("Fee-on-transfer token rejection (#68)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows specific fee-on-transfer error message when contract returns FeeOnTransferToken", async () => {
    (lookupToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Contract error: FeeOnTransferToken"),
    );

    render(<NewGovernanceProposalPage />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "AddToken" } });

    const input = screen.getByPlaceholderText("G...");
    fireEvent.change(input, { target: { value: VALID_ADDR } });

    await waitFor(() =>
      expect(
        screen.getByText(/fee-on-transfer.*cannot be added/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows proactive tooltip on the token address field", async () => {
    render(<NewGovernanceProposalPage />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "AddToken" } });

    expect(
      screen.getByLabelText(/ILN does not support fee-on-transfer tokens/i),
    ).toBeInTheDocument();
  });

  it("shows generic error message for non-fee-on-transfer failures", async () => {
    (lookupToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Token not found"),
    );

    render(<NewGovernanceProposalPage />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "AddToken" } });

    const input = screen.getByPlaceholderText("G...");
    fireEvent.change(input, { target: { value: VALID_ADDR } });

    await waitFor(() =>
      expect(screen.getByText("Token not found")).toBeInTheDocument(),
    );
  });
});
