import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LPEarningsHistory from "../LPEarningsHistory";
import { Invoice } from "@/utils/soroban";
import * as exportData from "@/utils/exportData";

vi.mock("@/utils/exportData", () => ({
  exportToCSV: vi.fn(),
}));

const mockInvoices: Invoice[] = [
  {
    id: 1n,
    freelancer: "freelancer1",
    payer: "payer1",
    amount: 100000000n, // 10 USDC
    due_date: 1680000000n,
    discount_rate: 500, // 5%
    status: "Paid",
    funder: "funder1",
    funded_at: 1670000000n,
    token: "token1",
  },
  {
    id: 2n,
    freelancer: "freelancer1",
    payer: "payer2",
    amount: 200000000n, // 20 USDC
    due_date: 1690000000n,
    discount_rate: 1000, // 10%
    status: "Paid",
    funder: "funder1",
    funded_at: 1685000000n,
    token: "token1",
  },
  {
    id: 3n,
    freelancer: "freelancer1",
    payer: "payer3",
    amount: 300000000n, // 30 USDC
    due_date: 1695000000n,
    discount_rate: 0,
    status: "Funded", // Not paid
    funder: "funder1",
    funded_at: 1685000000n,
  },
  {
    id: 4n,
    freelancer: "freelancer1",
    payer: "payer4",
    amount: 400000000n, // 40 USDC
    due_date: 1695000000n,
    discount_rate: 0,
    status: "Paid",
    funder: "otherfunder", // Different funder
    funded_at: 1685000000n,
  },
];

describe("LPEarningsHistory", () => {
  it("renders empty state when no paid invoices match the funder address", () => {
    render(<LPEarningsHistory invoices={mockInvoices} isLoading={false} address="addressWithoutInvoices" />);
    expect(screen.getByText("No Earnings History found.")).toBeInTheDocument();
  });

  it("renders paid invoices for the given address and formats data correctly", () => {
    render(<LPEarningsHistory invoices={mockInvoices} isLoading={false} address="funder1" />);

    // Should render invoice 1 and 2, but not 3 (not Paid) or 4 (different funder)
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.queryByText("#3")).not.toBeInTheDocument();
    expect(screen.queryByText("#4")).not.toBeInTheDocument();

    // Check formatting for invoice 1 (10 USDC amount, 5% discount -> 0.5 USDC yield)
    // Paid out = 10.5 USDC, Earned = +0.5 USDC
    expect(screen.getAllByText("10 USDC").length).toBeGreaterThan(0); // Amount Funded
    expect(screen.getByText("10.5 USDC")).toBeInTheDocument(); // Payout Received
    expect(screen.getByText("+0.5 USDC")).toBeInTheDocument(); // Earned
    expect(screen.getByText("5.00%")).toBeInTheDocument(); // Yield
  });

  it("exports all filtered rows to CSV", () => {
    const exportSpy = vi.spyOn(exportData, "exportToCSV");
    render(<LPEarningsHistory invoices={mockInvoices} isLoading={false} address="funder1" />);

    const exportButton = screen.getByRole("button", { name: /export csv/i });
    fireEvent.click(exportButton);

    expect(exportSpy).toHaveBeenCalledTimes(1);

    const callArgs = exportSpy.mock.calls[0];
    expect(callArgs[0]).toHaveLength(2); // Only 2 invoices match
    expect(callArgs[0][0]["Invoice ID"]).toBe("2"); // Sorted by date desc, so #2 is first
    expect(callArgs[0][1]["Invoice ID"]).toBe("1");
    expect(callArgs[1]).toMatch(/ILN-LP-Earnings-\d{4}-\d{2}-\d{2}\.csv/);
  });
});
