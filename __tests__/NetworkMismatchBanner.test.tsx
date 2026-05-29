import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NetworkMismatchBanner from "@/components/NetworkMismatchBanner";

const mockUseWallet = vi.fn();

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => mockUseWallet(),
}));

vi.mock("@/utils/network", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/network")>();
  return {
    ...actual,
    getConfiguredStellarNetwork: () => "testnet",
  };
});

describe("NetworkMismatchBanner", () => {
  beforeEach(() => {
    mockUseWallet.mockReset();
  });

  it("renders nothing when wallet is not connected", () => {
    mockUseWallet.mockReturnValue({
      isConnected: false,
      networkMismatch: false,
      walletNetwork: null,
    });
    const { container } = render(<NetworkMismatchBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when networks match", () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      networkMismatch: false,
      walletNetwork: "testnet",
    });
    const { container } = render(<NetworkMismatchBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("shows warning when wallet network mismatches app config", () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      networkMismatch: true,
      walletNetwork: "mainnet",
    });
    render(<NetworkMismatchBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Network mismatch/i)).toBeInTheDocument();
    expect(screen.getByText(/configured for Testnet/i)).toBeInTheDocument();
    expect(screen.getByText(/wallet is on Mainnet/i)).toBeInTheDocument();
  });

  it("hides when mismatch is resolved", () => {
    mockUseWallet.mockReturnValue({
      isConnected: true,
      networkMismatch: true,
      walletNetwork: "mainnet",
    });
    const { rerender, container } = render(<NetworkMismatchBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    mockUseWallet.mockReturnValue({
      isConnected: true,
      networkMismatch: false,
      walletNetwork: "testnet",
    });
    rerender(<NetworkMismatchBanner />);
    expect(container.firstChild).toBeNull();
  });
});
