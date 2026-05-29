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
    amount_paid: 0n,
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

  it('should show Make Payment button for Funded state', async () => {
    (useWallet as any).mockReturnValue({
      address: 'GPAYER',
    });

    const params = Promise.resolve({ id: '1' }) as any;
    params._resolvedValue = { id: '1' };
    render(<PayInvoicePage params={params} />);

    await waitFor(() => {
      expect(screen.getByText('Make Payment')).toBeInTheDocument();
    });
  });

  it('should open payment modal when Make Payment button is clicked', async () => {
    (useWallet as any).mockReturnValue({
      address: 'GPAYER',
    });

    const params = Promise.resolve({ id: '1' }) as any;
    params._resolvedValue = { id: '1' };
    render(<PayInvoicePage params={params} />);

    await waitFor(() => {
      expect(screen.getByText('Make Payment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Make Payment'));

    await waitFor(() => {
      expect(screen.getByText('Payment Amount')).toBeInTheDocument();
    });
  });

  it('should call markPaid with correct amount when payment is confirmed', async () => {
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

    // Open modal
    await waitFor(() => {
      fireEvent.click(screen.getByText('Make Payment'));
    });

    // Enter partial amount
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '50' } });

    // Confirm payment
    const confirmBtn = screen.getByText('Confirm Payment');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(soroban.markPaid).toHaveBeenCalledWith('GPAYER', 1n, 500000000n); // 50 USDC in stroops
      expect(soroban.submitSignedTransaction).toHaveBeenCalled();
      expect(mockToast.updateToast).toHaveBeenCalledWith("toast-id", expect.objectContaining({ type: "success" }));
    });
  });

  it('should call markPaid with full amount when Pay Full Amount button is clicked', async () => {
    const mockSignTx = vi.fn();
    (useWallet as any).mockReturnValue({
      address: 'GPAYER',
      signTx: mockSignTx,
    });

    (soroban.markPaid as any).mockResolvedValue('mock-tx');
    (soroban.submitSignedTransaction as any).mockResolvedValue({ txHash: 'hash123' });

    const params = Promise.resolve({ id: '1' }) as any;
    params._resolvedValue = { id: '1' };
    render(<PayInvoicePage params={params} />);

    // Open modal
    await waitFor(() => {
      fireEvent.click(screen.getByText('Make Payment'));
    });

    // Click Pay Full Amount button
    const payFullBtn = screen.getByText(/Pay Full Remaining Amount/);
    fireEvent.click(payFullBtn);

    // Confirm payment
    const confirmBtn = screen.getByText('Confirm Payment');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(soroban.markPaid).toHaveBeenCalledWith('GPAYER', 1n, 1000000000n); // Full amount in stroops
      expect(soroban.submitSignedTransaction).toHaveBeenCalled();
    });
  });

  it('should refresh invoice after successful payment', async () => {
    const mockSignTx = vi.fn();
    (useWallet as any).mockReturnValue({
      address: 'GPAYER',
      signTx: mockSignTx,
    });

    (soroban.markPaid as any).mockResolvedValue('mock-tx');
    (soroban.submitSignedTransaction as any).mockResolvedValue({ txHash: 'hash123' });

    const params = Promise.resolve({ id: '1' }) as any;
    params._resolvedValue = { id: '1' };
    render(<PayInvoicePage params={params} />);

    // Open modal
    await waitFor(() => {
      fireEvent.click(screen.getByText('Make Payment'));
    });

    // Enter amount and confirm
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Confirm Payment'));

    await waitFor(() => {
      expect(soroban.getInvoice).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });
});
