import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WalletSelectionModal from "../WalletSelectionModal";

describe("WalletSelectionModal", () => {
  it("renders Freighter and WalletConnect options", () => {
    render(
      <WalletSelectionModal
        isOpen
        walletConnectConfigured
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: /connect wallet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /freighter/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /walletconnect/i })).toBeInTheDocument();
    expect(screen.getByText(/qr code/i)).toBeInTheDocument();
  });

  it("returns the selected provider", () => {
    const onSelect = vi.fn();
    render(
      <WalletSelectionModal
        isOpen
        walletConnectConfigured
        onClose={vi.fn()}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /walletconnect/i }));
    expect(onSelect).toHaveBeenCalledWith("walletconnect");
  });

  it("disables WalletConnect when no project id is configured", () => {
    render(
      <WalletSelectionModal
        isOpen
        walletConnectConfigured={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /walletconnect/i })).toBeDisabled();
    expect(screen.getByText(/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID/)).toBeInTheDocument();
  });
});
