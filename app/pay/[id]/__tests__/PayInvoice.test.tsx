import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PayInvoicePage from "../page";
import * as soroban from "@/utils/soroban";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";
import type { Invoice } from "@/utils/soroban";

// Mock context and utils
vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/utils/soroban", () => ({
  getInvoice: vi.fn(),
  markPaid: vi.fn(),
  disputeInvoice: vi.fn(),
  submitSignedTransaction: vi.fn(),
}));

const PAYER = "GCSXPYZSTPKX2GDVW6XSJDBE3PVSNSXCCLTGSPJXNF57IJU5EDU6IUDV";
const OTHER_WALLET = "GDIEC472DEK3S5UWVKYDBXG74R53KMHGXGFIURLJUF6P6JJ352HLLJED";

type TestParams = Promise<{ id: string }> & { _resolvedValue?: { id: string } };

function createParams(): TestParams {
  const params = Promise.resolve({ id: "1" }) as TestParams;
  params._resolvedValue = { id: "1" };
  return params;
}

describe("PayInvoicePage", () => {
  const mockInvoice: Invoice = {
    id: 1n,
    freelancer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    payer: PAYER,
    amount: 1000000000n,
    due_date: 1713960000n,
    discount_rate: 300,
    status: "Funded",
  };

  const mockToast = {
    addToast: vi.fn().mockReturnValue("toast-id"),
    updateToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue(mockToast as ReturnType<typeof useToast>);
    vi.mocked(soroban.getInvoice).mockResolvedValue(mockInvoice);
  });

  it("should render invoice summary without wallet connection", async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: null,
      connect: vi.fn(),
    } as unknown as ReturnType<typeof useWallet>);

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText(/100\s+USDC/)).toBeInTheDocument();
      expect(screen.getByText("Connect Wallet and Pay")).toBeInTheDocument();
    });
  });

  it("should show warning if connected wallet is not the payer", async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: OTHER_WALLET,
      connect: vi.fn(),
    } as unknown as ReturnType<typeof useWallet>);

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText("Address Mismatch")).toBeInTheDocument();
      expect(screen.getByText("Restricted to Registered Payer")).toBeInTheDocument();
    });
  });

  it("should show confirmation if invoice is already paid", async () => {
    vi.mocked(soroban.getInvoice).mockResolvedValue({
      ...mockInvoice,
      status: "Paid",
    });

    vi.mocked(useWallet).mockReturnValue({
      address: PAYER,
    } as unknown as ReturnType<typeof useWallet>);

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText("Invoice settled")).toBeInTheDocument();
      expect(screen.getByText("Settlement Complete")).toBeInTheDocument();
    });
  });

  it("should call markPaid when Settle button is clicked", async () => {
    const mockSignTx = vi.fn();
    vi.mocked(useWallet).mockReturnValue({
      address: PAYER,
      signTx: mockSignTx,
    } as unknown as ReturnType<typeof useWallet>);

    vi.mocked(soroban.markPaid).mockResolvedValue(
      "mock-tx" as unknown as Awaited<ReturnType<typeof soroban.markPaid>>,
    );
    vi.mocked(soroban.submitSignedTransaction).mockResolvedValue({ txHash: "hash123" });

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText("Settle Invoice Now")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Settle Invoice Now"));

    await waitFor(() => {
      expect(soroban.markPaid).toHaveBeenCalledWith(PAYER, 1n);
      expect(soroban.submitSignedTransaction).toHaveBeenCalled();
      expect(mockToast.updateToast).toHaveBeenCalledWith("toast-id", expect.objectContaining({ type: "success" }));
    });
  });

  it("shows payer-only dispute action for funded invoices and submits reason hash", async () => {
    const mockSignTx = vi.fn();
    vi.mocked(useWallet).mockReturnValue({
      address: PAYER,
      signTx: mockSignTx,
    } as unknown as ReturnType<typeof useWallet>);
    vi.mocked(soroban.disputeInvoice).mockResolvedValue(
      "dispute-tx" as unknown as Awaited<ReturnType<typeof soroban.disputeInvoice>>,
    );
    vi.mocked(soroban.submitSignedTransaction).mockResolvedValue({ txHash: "dispute-hash" });

    render(<PayInvoicePage params={createParams()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Raise Dispute" }));
    fireEvent.change(screen.getByLabelText("Evidence description"), {
      target: { value: "hello" },
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Raise Dispute" }));

    await waitFor(() => {
      expect(soroban.disputeInvoice).toHaveBeenCalledWith(
        PAYER,
        1n,
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      );
      expect(soroban.submitSignedTransaction).toHaveBeenCalledWith({
        tx: "dispute-tx",
        signTx: mockSignTx,
      });
    });
  });

  it("does not show dispute action to non-payers", async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: OTHER_WALLET,
      connect: vi.fn(),
    } as unknown as ReturnType<typeof useWallet>);

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText("Restricted to Registered Payer")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Raise Dispute" })).not.toBeInTheDocument();
  });
});
