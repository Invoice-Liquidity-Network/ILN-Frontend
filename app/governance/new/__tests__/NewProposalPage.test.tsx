import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewProposalPage from "../page";
import { FEE_ON_TRANSFER_TOKEN_ERROR } from "@/utils/governance";

const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();
const connect = vi.fn();
const signTx = vi.fn();
const push = vi.fn();
const createProposal = vi.fn();
const lookupToken = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <nav>Navigation</nav>,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast }),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    address: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    connect,
    isConnected: true,
    signTx,
  }),
}));

vi.mock("@/utils/governance", async () => {
  const actual = await vi.importActual<typeof import("@/utils/governance")>("@/utils/governance");

  return {
    ...actual,
    createProposal: (...args: unknown[]) => createProposal(...args),
    fetchProtocolParameters: vi.fn().mockResolvedValue({
      acceptedTokens: [
        {
          address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          name: "USD Coin",
          symbol: "USDC",
        },
      ],
      feeRateBps: 50,
      maxDiscountRateBps: 500,
      minProposalILN: 500,
    }),
    getVotingPower: vi.fn().mockResolvedValue(1_250),
    isValidStellarAddress: (address: string) => address.startsWith("G") && address.length === 56,
    lookupToken: (...args: unknown[]) => lookupToken(...args),
  };
});

describe("NewProposalPage", () => {
  beforeEach(() => {
    addToast.mockClear();
    updateToast.mockClear();
    connect.mockClear();
    signTx.mockClear();
    push.mockClear();
    createProposal.mockReset();
    lookupToken.mockReset();
    lookupToken.mockResolvedValue({
      address: "GFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFX",
      name: "Fee Token",
      symbol: "FEE",
    });
  });

  it("shows proactive fee-on-transfer guidance on the token addition form", async () => {
    render(<NewProposalPage />);

    fireEvent.click(await screen.findByRole("button", { name: /add token/i }));

    expect(screen.getByText("ILN does not support fee-on-transfer tokens")).toBeInTheDocument();
  });

  it("shows the specific token address error when add-token submission rejects fee-on-transfer tokens", async () => {
    createProposal.mockRejectedValue(new Error("HostError: Error(Contract, #FeeOnTransferToken)"));

    render(<NewProposalPage />);

    fireEvent.click(await screen.findByRole("button", { name: /add token/i }));
    fireEvent.change(screen.getByPlaceholderText("G... (56-character Stellar address)"), {
      target: { value: "GFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFX" },
    });

    await waitFor(() => expect(lookupToken).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/provide the rationale/i), {
      target: {
        value: "This token should be evaluated for allowlist support after transfer behavior checks.",
      },
    });

    await waitFor(() => expect(screen.getByDisplayValue(/Add FEE as Accepted Protocol Token/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /submit proposal/i }));

    expect(await screen.findByText(FEE_ON_TRANSFER_TOKEN_ERROR)).toBeInTheDocument();
    expect(updateToast).toHaveBeenCalledWith(
      "toast-id",
      expect.objectContaining({
        message: FEE_ON_TRANSFER_TOKEN_ERROR,
        title: "Submission failed",
        type: "error",
      }),
    );
    expect(push).not.toHaveBeenCalled();
  });
});
