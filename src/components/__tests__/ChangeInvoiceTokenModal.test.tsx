import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChangeInvoiceTokenModal from "@/components/ChangeInvoiceTokenModal";
import { buildConvertInvoiceTokenTransaction, type Invoice } from "@/utils/soroban";

const runTransaction = vi.fn();
const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();

vi.mock("@/hooks/useTransaction", () => ({
  useTransaction: () => ({
    isPending: false,
    runTransaction,
  }),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast }),
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokens: [
      { contractId: "CUSDC", name: "USD Coin", symbol: "USDC", decimals: 7, iconLabel: "US" },
      { contractId: "CEURC", name: "Euro Coin", symbol: "EURC", decimals: 7, iconLabel: "EU" },
    ],
    tokenMap: new Map([
      ["CUSDC", { contractId: "CUSDC", name: "USD Coin", symbol: "USDC", decimals: 7, iconLabel: "US" }],
      ["CEURC", { contractId: "CEURC", name: "Euro Coin", symbol: "EURC", decimals: 7, iconLabel: "EU" }],
    ]),
    defaultToken: { contractId: "CUSDC", name: "USD Coin", symbol: "USDC", decimals: 7, iconLabel: "US" },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/utils/soroban", async () => {
  const actual = await vi.importActual<typeof import("@/utils/soroban")>("@/utils/soroban");
  return {
    ...actual,
    buildConvertInvoiceTokenTransaction: vi.fn().mockResolvedValue("tx"),
  };
});

const invoice: Invoice = {
  id: 12n,
  status: "Pending",
  freelancer: "GFREELANCER",
  payer: "GPAYER",
  amount: 10_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 300,
  token: "CUSDC",
};

describe("ChangeInvoiceTokenModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runTransaction.mockImplementation(async (builder: () => Promise<unknown>) => {
      await builder();
      return { txHash: "hash123" };
    });
  });

  it("shows the current token, allowlisted token selector, and denomination warning", () => {
    render(
      <ChangeInvoiceTokenModal
        invoice={invoice}
        submitter="GFREELANCER"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Change Token" })).toBeInTheDocument();
    expect(screen.getByText("This changes the currency your invoice is denominated in.")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /new token/i })).toHaveValue("CEURC");
  });

  it("builds and submits convert_invoice_token through useTransaction", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ChangeInvoiceTokenModal
        invoice={invoice}
        submitter="GFREELANCER"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Change Token" }));

    await waitFor(() =>
      expect(buildConvertInvoiceTokenTransaction).toHaveBeenCalledWith({
        submitter: "GFREELANCER",
        invoiceId: 12n,
        newToken: "CEURC",
      })
    );
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(updateToast).toHaveBeenCalledWith(
      "toast-id",
      expect.objectContaining({ type: "success", txHash: "hash123" })
    );
    expect(onSuccess).toHaveBeenCalledWith("CEURC");
    expect(onClose).toHaveBeenCalled();
  });
});
