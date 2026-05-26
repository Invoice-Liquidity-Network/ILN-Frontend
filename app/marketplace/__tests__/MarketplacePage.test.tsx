import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketplacePage from "../page";
import { getAllInvoices, getPayerScoresBatch } from "@/utils/soroban";

const TOKEN_ID = "USDC";

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
  useWallet: () => ({
    isConnected: true,
  }),
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => {
    const token = {
      contractId: TOKEN_ID,
      name: "USD Coin",
      symbol: "USDC",
      decimals: 7,
      iconLabel: "US",
      logo: "/tokens/usdc.svg",
      isAllowed: true,
    };
    return {
      tokens: [token],
      tokenMap: new Map([[TOKEN_ID, token]]),
      defaultToken: token,
    };
  },
}));

vi.mock("@/utils/soroban", async () => {
  const actual = await vi.importActual<typeof import("@/utils/soroban")>("@/utils/soroban");
  return {
    ...actual,
    getAllInvoices: vi.fn(),
    getPayerScoresBatch: vi.fn(),
  };
});

function invoice(id: number, overrides: Partial<Awaited<ReturnType<typeof getAllInvoices>>[number]> = {}) {
  return {
    id: BigInt(id),
    status: "Pending",
    freelancer: `GFREELANCER${id}`,
    payer: `GPAYER${id}`,
    amount: BigInt(id * 100_000_000),
    due_date: BigInt(1_800_000_000 + id * 1_000),
    discount_rate: id * 100,
    token: TOKEN_ID,
    ...overrides,
  };
}

describe("MarketplacePage", () => {
  beforeEach(() => {
    vi.mocked(getAllInvoices).mockResolvedValue([
      invoice(1, { discount_rate: 300 }),
      invoice(2, { status: "Funded", discount_rate: 800 }),
      invoice(3, { discount_rate: 900 }),
    ]);
    vi.mocked(getPayerScoresBatch).mockResolvedValue(
      new Map([
        ["GPAYER1", { score: 70, settled_on_time: 3, defaults: 0 }],
        ["GPAYER3", { score: 95, settled_on_time: 8, defaults: 0 }],
      ]),
    );
  });

  it("renders pending invoices with funding CTAs and payer reputation", async () => {
    render(<MarketplacePage />);

    expect(await screen.findByText("Invoice Marketplace")).toBeInTheDocument();
    await waitFor(() => expect(getAllInvoices).toHaveBeenCalledOnce());

    expect(screen.getByText("Invoice #1")).toBeInTheDocument();
    expect(screen.getByText("Invoice #3")).toBeInTheDocument();
    expect(screen.queryByText("Invoice #2")).not.toBeInTheDocument();
    expect(screen.getAllByText("Fund Invoice")).toHaveLength(2);
    expect(screen.getAllByLabelText(/risk level: low/i)).toHaveLength(2);
    expect(screen.getByText("Reputation 70/100")).toBeInTheDocument();
    expect(screen.getByText("Reputation 95/100")).toBeInTheDocument();
  });

  it("sorts by highest yield first by default and filters by minimum yield", async () => {
    render(<MarketplacePage />);

    await screen.findByText("Invoice #1");
    const cardsBefore = screen.getAllByText(/Invoice #/).map((node) => node.textContent);
    expect(cardsBefore).toEqual(["Invoice #3", "Invoice #1"]);

    fireEvent.change(screen.getByLabelText(/min yield/i), { target: { value: "5" } });

    expect(screen.queryByText("Invoice #1")).not.toBeInTheDocument();
    expect(screen.getByText("Invoice #3")).toBeInTheDocument();
  });
});
