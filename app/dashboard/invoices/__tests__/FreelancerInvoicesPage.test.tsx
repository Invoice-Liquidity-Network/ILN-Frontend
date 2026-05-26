import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FreelancerInvoicesPage from "../page";
import type { Invoice } from "@/utils/soroban";

const SUBMITTER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

let isConnected = true;
let mockInvoices: Invoice[] = [];
const connect = vi.fn();

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    address: SUBMITTER,
    isConnected,
    connect,
  }),
}));

vi.mock("@/hooks/useInvoices", () => ({
  useSubmitterInvoices: () => ({
    data: mockInvoices,
    isLoading: false,
  }),
}));

const usdcToken = {
  contractId: "token-usdc",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  iconLabel: "US",
  logo: "/tokens/usdc.svg",
  isAllowed: true,
};

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokenMap: new Map([["token-usdc", usdcToken]]),
    defaultToken: usdcToken,
  }),
}));

function invoice(overrides: Partial<Invoice> & Pick<Invoice, "id">): Invoice {
  return {
    id: overrides.id,
    freelancer: SUBMITTER,
    payer: `GPAYER${overrides.id.toString().padStart(2, "0")}`,
    amount: 1_000_000n * overrides.id,
    due_date: 1_800_000_000n + overrides.id,
    discount_rate: 300,
    status: "Pending",
    token: "token-usdc",
    ...overrides,
  };
}

describe("FreelancerInvoicesPage", () => {
  beforeEach(() => {
    isConnected = true;
    connect.mockReset();
    mockInvoices = [
      invoice({ id: 1n, payer: "GPAYER1111111111111111111111111111111111111111111111111", status: "Pending" }),
      invoice({ id: 2n, payer: "GPAYER2222222222222222222222222222222222222222222222222", status: "Paid" }),
    ];
  });

  it("renders the connected submitter invoice table", () => {
    render(<FreelancerInvoicesPage />);

    expect(screen.getByRole("heading", { name: /submitted invoice dashboard/i })).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.queryByText("#3")).not.toBeInTheDocument();
    expect(screen.getByText("2 invoices")).toBeInTheDocument();
    expect(screen.getAllByText("View")).toHaveLength(2);
  });

  it("filters rows by invoice status", () => {
    render(<FreelancerInvoicesPage />);

    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: "Paid" } });

    expect(screen.queryByText("#1")).not.toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("1 invoice")).toBeInTheDocument();
  });

  it("prompts disconnected users to connect Freighter", () => {
    isConnected = false;

    render(<FreelancerInvoicesPage />);

    fireEvent.click(screen.getByRole("button", { name: /connect freighter/i }));
    expect(connect).toHaveBeenCalledOnce();
  });
});
