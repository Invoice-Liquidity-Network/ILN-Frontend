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
  submitSignedTransaction: vi.fn(),
  transferLpPosition: vi.fn(),
}));

const PAYER = "GCSXPYZSTPKX2GDVW6XSJDBE3PVSNSXCCLTGSPJXNF57IJU5EDU6IUDV";
const FUNDER = "GDIEC472DEK3S5UWVKYDBXG74R53KMHGXGFIURLJUF6P6JJ352HLLJED";
const NEW_FUNDER = "GCBXRCREFHR6YEJ4VFRGRLRACPGWSZUKRIKG3ZNGV5DGYIUEE2GTWYNO";

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
    discount_rate: 500,
    status: "Funded",
    funder: FUNDER,
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

  it("should show warning if connected wallet is neither payer nor LP", async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: NEW_FUNDER,
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

  it("shows LP-only transfer action and updates the LP field after transfer", async () => {
    const mockSignTx = vi.fn();
    vi.mocked(useWallet).mockReturnValue({
      address: FUNDER,
      connect: vi.fn(),
      signTx: mockSignTx,
    } as unknown as ReturnType<typeof useWallet>);

    vi.mocked(soroban.transferLpPosition).mockResolvedValue(
      "transfer-tx" as unknown as Awaited<ReturnType<typeof soroban.transferLpPosition>>,
    );
    vi.mocked(soroban.submitSignedTransaction).mockResolvedValue({ txHash: "transfer-hash" });

    render(<PayInvoicePage params={createParams()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Transfer Position" }));
    fireEvent.change(screen.getByLabelText("New LP address"), {
      target: { value: NEW_FUNDER },
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Transfer Position" }));

    await waitFor(() => {
      expect(soroban.transferLpPosition).toHaveBeenCalledWith(FUNDER, 1n, NEW_FUNDER);
      expect(soroban.submitSignedTransaction).toHaveBeenCalledWith({
        tx: "transfer-tx",
        signTx: mockSignTx,
      });
    });
  });
});
