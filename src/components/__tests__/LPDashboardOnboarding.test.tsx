import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import LPDashboard from "../LPDashboard";

vi.mock("@/hooks/useInvoices", () => ({
  useInvoices: () => ({ data: [], isLoading: false, dataUpdatedAt: Date.now() }),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GTEST", isConnected: true, connect: vi.fn(), signTx: vi.fn().mockResolvedValue("signed") }),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast: vi.fn(() => "toast-id"), updateToast: vi.fn(), removeToast: vi.fn() }),
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({ tokenMap: new Map(), defaultToken: { contractId: "USD", symbol: "USDC" }, tokens: [] }),
}));

vi.mock("@/hooks/useWatchlist", () => ({
  useWatchlist: () => ({ watchlist: [], toggleWatchlist: vi.fn(), isInWatchlist: vi.fn().mockReturnValue(false) }),
}));

vi.mock("@/hooks/usePayerScores", () => ({
  usePayerScores: () => ({ scores: new Map(), risks: new Map() }),
}));

vi.mock("@/hooks/useLPSettings", () => ({
  useLPSettings: () => ({ settings: { minReputation: 0 } }),
}));

vi.mock("@/hooks/useInvoiceFilters", () => ({
  useInvoiceFilters: () => ({
    filters: {},
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    activeFilterCount: 0,
  }),
  applyInvoiceFilters: (_invoices: any) => _invoices,
}));

describe("LPDashboard onboarding", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows onboarding for first-time LPs without funded positions", async () => {
    render(<LPDashboard />);

    expect(await screen.findByRole("heading", { name: /welcome to iln/i })).toBeInTheDocument();
  });

  it("persists onboarding completion and does not show again", async () => {
    localStorage.setItem("iln_lp_onboarding_completed_GTEST", "true");

    render(<LPDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /welcome to iln/i })).not.toBeInTheDocument();
    });
  });
});
