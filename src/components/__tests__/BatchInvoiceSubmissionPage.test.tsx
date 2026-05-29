import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BatchInvoiceSubmissionPage from "../BatchInvoiceSubmissionPage";

const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();
const submitBatchInvoicesTransaction = vi.fn();

const walletState = {
  address: "GDIEC472DEK3S5UWVKYDBXG74R53KMHGXGFIURLJUF6P6JJ352HLLJED",
  isConnected: true,
  networkMismatch: false,
  connect: vi.fn(),
  signTx: vi.fn(),
};

const PAYER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const TOKEN_ID = "GCSXPYZSTPKX2GDVW6XSJDBE3PVSNSXCCLTGSPJXNF57IJU5EDU6IUDV";

vi.mock("../Navbar", () => ({
  default: () => <nav>Navbar</nav>,
}));

vi.mock("../Footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("../../context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast }),
}));

vi.mock("../../context/WalletContext", () => ({
  useWallet: () => ({ ...walletState }),
}));

vi.mock("../../hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokens: [{ symbol: "USDC", decimals: 7, contractId: TOKEN_ID, name: "USD Coin", iconLabel: "US" }],
    tokenMap: new Map([[TOKEN_ID, { symbol: "USDC", decimals: 7, contractId: TOKEN_ID, name: "USD Coin", iconLabel: "US" }]]),
    defaultToken: { symbol: "USDC", decimals: 7, contractId: TOKEN_ID, name: "USD Coin", iconLabel: "US" },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../utils/soroban", () => ({
  submitBatchInvoicesTransaction: (...args: unknown[]) => submitBatchInvoicesTransaction(...args),
}));

describe("BatchInvoiceSubmissionPage", () => {
  beforeEach(() => {
    addToast.mockClear();
    updateToast.mockClear();
    submitBatchInvoicesTransaction.mockReset();
    walletState.networkMismatch = false;
  });

  it("parses CSV rows, previews them, and submits the batch", async () => {
    submitBatchInvoicesTransaction.mockResolvedValue({ txHash: "batch-hash" });
    render(<BatchInvoiceSubmissionPage />);

    fireEvent.change(screen.getByLabelText("CSV rows"), {
      target: {
        value: `payer,amount,token,discount_rate,due_date\n${PAYER},50,USDC,3,2030-01-01`,
      },
    });

    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("1 / 50")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit Batch" }));

    await waitFor(() => {
      expect(submitBatchInvoicesTransaction).toHaveBeenCalledWith({
        freelancer: walletState.address,
        invoices: [
          {
            payer: PAYER,
            amount: 500_000_000n,
            token: TOKEN_ID,
            discountRate: 300,
            dueDate: expect.any(Number),
          },
        ],
        signTx: walletState.signTx,
      });
    });
    expect(await screen.findByText("success")).toBeInTheDocument();
  });

  it("shows inline validation errors and disables submit", async () => {
    render(<BatchInvoiceSubmissionPage />);

    fireEvent.change(screen.getByLabelText("CSV rows"), {
      target: {
        value: "payer,amount,token,discount_rate,due_date\nBAD,0,NOPE,90,2020-01-01",
      },
    });

    expect(await screen.findByText("Enter a valid Stellar G-address.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Batch" })).toBeDisabled();
    expect(submitBatchInvoicesTransaction).not.toHaveBeenCalled();
  });
});
