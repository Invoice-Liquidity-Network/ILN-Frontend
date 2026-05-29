import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CancelInvoiceButton from "../CancelInvoiceButton";
import { useToast } from "@/context/ToastContext";
import { useWallet } from "@/context/WalletContext";
import { cancelInvoice, submitSignedTransaction } from "@/utils/soroban";

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(),
}));

vi.mock("@/utils/soroban", () => ({
  cancelInvoice: vi.fn(),
  submitSignedTransaction: vi.fn(),
}));

describe("CancelInvoiceButton", () => {
  const toast = {
    addToast: vi.fn(() => "toast-id"),
    updateToast: vi.fn(),
  };
  const onCancelled = vi.fn();
  const signTx = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue(toast);
    vi.mocked(useWallet).mockReturnValue({
      address: "GFREELANCER",
      isConnected: true,
      isInstalled: true,
      error: null,
      networkMismatch: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTx,
    });
    vi.mocked(cancelInvoice).mockResolvedValue({ tx: "prepared-tx" });
    vi.mocked(submitSignedTransaction).mockResolvedValue({ txHash: "hash-123" });
  });

  it("only renders for the submitter while the invoice is pending", () => {
    const { rerender } = render(
      <CancelInvoiceButton invoiceId={1n} freelancer="GFREELANCER" status="Pending" onCancelled={onCancelled} />,
    );
    expect(screen.getByRole("button", { name: /cancel invoice/i })).toBeInTheDocument();

    rerender(
      <CancelInvoiceButton invoiceId={1n} freelancer="GFREELANCER" status="Funded" onCancelled={onCancelled} />,
    );
    expect(screen.queryByRole("button", { name: /cancel invoice/i })).not.toBeInTheDocument();

    vi.mocked(useWallet).mockReturnValue({
      address: "GOTHER",
      isConnected: true,
      isInstalled: true,
      error: null,
      networkMismatch: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTx,
    });
    rerender(
      <CancelInvoiceButton invoiceId={1n} freelancer="GFREELANCER" status="Pending" onCancelled={onCancelled} />,
    );
    expect(screen.queryByRole("button", { name: /cancel invoice/i })).not.toBeInTheDocument();
  });

  it("confirms, submits cancellation, and reports success", async () => {
    render(
      <CancelInvoiceButton invoiceId={7n} freelancer="GFREELANCER" status="Pending" onCancelled={onCancelled} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel invoice/i }));
    expect(screen.getByText("Are you sure? This cannot be undone.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm cancel/i }));

    await waitFor(() => {
      expect(cancelInvoice).toHaveBeenCalledWith("GFREELANCER", 7n);
      expect(submitSignedTransaction).toHaveBeenCalledWith({ tx: "prepared-tx", signTx });
      expect(onCancelled).toHaveBeenCalledOnce();
      expect(toast.updateToast).toHaveBeenCalledWith(
        "toast-id",
        expect.objectContaining({ type: "success", title: "Invoice Cancelled", txHash: "hash-123" }),
      );
    });
  });

  it("shows the failure reason when cancellation fails", async () => {
    vi.mocked(cancelInvoice).mockRejectedValue(new Error("contract rejected"));
    render(
      <CancelInvoiceButton invoiceId={9n} freelancer="GFREELANCER" status="Pending" onCancelled={onCancelled} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel invoice/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm cancel/i }));

    await waitFor(() => {
      expect(onCancelled).not.toHaveBeenCalled();
      expect(toast.updateToast).toHaveBeenCalledWith(
        "toast-id",
        expect.objectContaining({ type: "error", title: "Cancellation Failed", message: "contract rejected" }),
      );
    });
  });
});
