import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvoiceDetailPage from "../page";

const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();
const connect = vi.fn();
const signTx = vi.fn().mockResolvedValue("signed-xdr");
const getInvoice = vi.fn();
const markPaid = vi.fn();
const cancelInvoice = vi.fn();
const submitSignedTransaction = vi.fn();

const walletState = {
  address: null as string | null,
  connect,
  signTx,
};

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast }),
}));

vi.mock("@/utils/soroban", () => ({
  getInvoice: (...args: unknown[]) => getInvoice(...args),
  markPaid: (...args: unknown[]) => markPaid(...args),
  cancelInvoice: (...args: unknown[]) => cancelInvoice(...args),
  submitSignedTransaction: (...args: unknown[]) => submitSignedTransaction(...args),
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokenMap: new Map([
      [
        "token-usdc",
        {
          contractId: "token-usdc",
          name: "USD Coin",
          symbol: "USDC",
          decimals: 7,
        },
      ],
    ]),
    defaultToken: {
      contractId: "token-usdc",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 7,
    },
  }),
}));

vi.mock("@/components/InvoiceEventHistory", () => ({
  default: ({ invoiceId }: { invoiceId: bigint }) => (
    <section data-testid="event-history">Events for {invoiceId.toString()}</section>
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockInvoice = {
  id: 12n,
  status: "Funded",
  freelancer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  payer: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRY",
  amount: 10_000_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 250,
  funder: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6",
  token: "token-usdc",
};

function renderPage(id = "12") {
  const params = Promise.resolve({ id }) as Promise<{ id: string }> & {
    _resolvedValue?: { id: string };
  };
  params._resolvedValue = { id };
  return render(<InvoiceDetailPage params={params} />);
}

describe("InvoiceDetailPage", () => {
  beforeEach(() => {
    walletState.address = null;
    connect.mockReset();
    signTx.mockClear();
    addToast.mockClear();
    updateToast.mockClear();
    getInvoice.mockReset();
    markPaid.mockReset();
    cancelInvoice.mockReset();
    submitSignedTransaction.mockReset();
    getInvoice.mockResolvedValue(mockInvoice);
    markPaid.mockResolvedValue("prepared-mark-paid-tx");
    cancelInvoice.mockResolvedValue({ tx: "prepared-cancel-tx" });
    submitSignedTransaction.mockResolvedValue({ txHash: "hash-123" });
  });

  it("renders invoice fields, lifecycle state, and event history for public viewers", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Invoice #12" })).toBeInTheDocument();
    expect(screen.getAllByText("Funded").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1,000 USDC")).toBeInTheDocument();
    expect(screen.getByText("2.50%")).toBeInTheDocument();
    expect(screen.getByText("token-usdc")).toBeInTheDocument();
    expect(screen.getByText("Events for 12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
  });

  it("lets the payer mark a funded invoice paid", async () => {
    walletState.address = mockInvoice.payer;
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Mark Paid" }));

    await waitFor(() => {
      expect(markPaid).toHaveBeenCalledWith(mockInvoice.payer, 12n);
      expect(submitSignedTransaction).toHaveBeenCalledWith({
        tx: "prepared-mark-paid-tx",
        signTx,
      });
    });
    expect(updateToast).toHaveBeenCalledWith("toast-id", expect.objectContaining({ type: "success" }));
  });

  it("lets the freelancer cancel a pending invoice", async () => {
    getInvoice.mockResolvedValue({ ...mockInvoice, status: "Pending", funder: undefined });
    walletState.address = mockInvoice.freelancer;
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Cancel Invoice" }));

    await waitFor(() => {
      expect(cancelInvoice).toHaveBeenCalledWith(mockInvoice.freelancer, 12n);
      expect(submitSignedTransaction).toHaveBeenCalledWith({
        tx: "prepared-cancel-tx",
        signTx,
      });
    });
  });

  it("shows a transfer position entry point to the funder", async () => {
    walletState.address = mockInvoice.funder;
    renderPage();

    expect(await screen.findByRole("link", { name: "Transfer Position" })).toHaveAttribute("href", "/lp");
  });

  it("shows not found state when the invoice cannot be loaded", async () => {
    getInvoice.mockRejectedValue(new Error("missing"));
    renderPage();

    expect(await screen.findByRole("heading", { name: "Invoice Not Found" })).toBeInTheDocument();
    expect(screen.getByText("Failed to load invoice details.")).toBeInTheDocument();
  });
});
