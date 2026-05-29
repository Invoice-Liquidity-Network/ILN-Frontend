import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LPPortfolioDashboardPage from "../page";
import { getLPPortfolioStats, listInvoicesByLP } from "@/utils/soroban";

const LP_ADDRESS = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6";

vi.mock("@/components/Navbar", () => ({
  default: () => <nav>Navbar</nav>,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("@/hooks/useDocumentTitle", () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(() => ({
    address: LP_ADDRESS,
    isConnected: true,
    connect: vi.fn(),
  })),
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => {
    const token = {
      contractId: "USDC",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 7,
      iconLabel: "US",
      logo: "/tokens/usdc.svg",
      isAllowed: true,
    };
    return {
      tokenMap: new Map([["USDC", token]]),
      defaultToken: token,
    };
  },
}));

vi.mock("@/utils/soroban", async () => {
  const actual = await vi.importActual<typeof import("@/utils/soroban")>("@/utils/soroban");
  return {
    ...actual,
    getLPPortfolioStats: vi.fn(),
    listInvoicesByLP: vi.fn(),
  };
});

const mockStats = {
  total_deployed_by_token: [{ token: "USDC", amount: 250_000_000n }],
  total_earned: 12_500_000n,
  active_positions_count: 1,
  average_yield_bps: 500,
};

const mockPosition = {
  id: 42n,
  status: "Funded",
  freelancer: "GFREELANCER",
  payer: "GPAYER",
  amount: 250_000_000n,
  due_date: 1_800_000_000n,
  discount_rate: 500,
  funder: LP_ADDRESS,
  token: "USDC",
};

describe("LPPortfolioDashboardPage", () => {
  beforeEach(() => {
    vi.mocked(getLPPortfolioStats).mockResolvedValue(mockStats);
    vi.mocked(listInvoicesByLP).mockResolvedValue([mockPosition]);
  });

  it("loads LP stats and positions for the connected wallet", async () => {
    render(<LPPortfolioDashboardPage />);

    expect(await screen.findByText("LP Portfolio Dashboard")).toBeInTheDocument();
    await waitFor(() => expect(getLPPortfolioStats).toHaveBeenCalledWith(LP_ADDRESS));
    expect(listInvoicesByLP).toHaveBeenCalledWith(LP_ADDRESS, 0, 10);

    expect(screen.getAllByText("25 USDC")).toHaveLength(2);
    expect(screen.getAllByText("1.25 USDC")).toHaveLength(2);
    expect(screen.getByText((_content, element) => element?.textContent === "5.00%")).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText("Transfer Position")).toBeInTheDocument();
  });

  it("paginates LP positions through list_invoices_by_lp", async () => {
    vi.mocked(listInvoicesByLP).mockResolvedValue(Array.from({ length: 10 }, (_, index) => ({
      ...mockPosition,
      id: BigInt(index + 1),
    })));

    render(<LPPortfolioDashboardPage />);
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await waitFor(() => expect(nextButton).not.toBeDisabled());
    fireEvent.click(nextButton);

    await waitFor(() => expect(listInvoicesByLP).toHaveBeenLastCalledWith(LP_ADDRESS, 1, 10));
  });
});
