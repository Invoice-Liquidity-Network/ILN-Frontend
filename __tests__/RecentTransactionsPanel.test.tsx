import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ProtocolFeedItem } from "@/utils/protocol-feed";
import RecentTransactionsPanel from "@/components/RecentTransactionsPanel";

const mockUseRecentProtocolFeed = vi.fn();

vi.mock("@/hooks/useRecentProtocolFeed", () => ({
  useRecentProtocolFeed: () => mockUseRecentProtocolFeed(),
}));

const sampleItems: ProtocolFeedItem[] = [
  {
    id: "feed-1",
    eventType: "InvoiceFunded",
    label: "Invoice Funded",
    icon: "payments",
    invoiceId: "42",
    amount: "1,500",
    token: "USDC",
    dateLabel: "Jun 15, 10:00 AM",
    timestampMs: Date.parse("2025-06-15T10:00:00.000Z"),
  },
  {
    id: "feed-2",
    eventType: "InvoicePaid",
    label: "Invoice Settled",
    icon: "check_circle",
    invoiceId: "7",
    amount: "500",
    token: "EURC",
    dateLabel: "Jun 15, 9:00 AM",
    timestampMs: Date.parse("2025-06-15T09:00:00.000Z"),
  },
];

describe("RecentTransactionsPanel", () => {
  beforeEach(() => {
    mockUseRecentProtocolFeed.mockReset();
  });

  it("renders feed items with type, amount, token, date, and invoice link", () => {
    mockUseRecentProtocolFeed.mockReturnValue({
      data: sampleItems,
      isLoading: false,
      isError: false,
    });

    render(<RecentTransactionsPanel />);

    expect(screen.getByTestId("recent-transactions-panel")).toBeInTheDocument();
    expect(screen.getByText("Invoice Funded")).toBeInTheDocument();
    expect(screen.getByText("Invoice Settled")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("USDC", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Jun 15, 10:00 AM")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Invoice #42/i })).toHaveAttribute("href", "/i/42");
  });

  it("shows loading skeleton while fetching", () => {
    mockUseRecentProtocolFeed.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<RecentTransactionsPanel />);
    expect(screen.getByLabelText("Loading recent transactions")).toBeInTheDocument();
  });

  it("applies slide-in animation class to newly added items", async () => {
    mockUseRecentProtocolFeed.mockReturnValue({
      data: [sampleItems[0]!],
      isLoading: false,
      isError: false,
    });

    const { rerender } = render(<RecentTransactionsPanel />);
    expect(screen.getByTestId("recent-transaction-item")).toHaveAttribute("data-animate-new", "false");

    const updatedItems: ProtocolFeedItem[] = [
      {
        id: "feed-new",
        eventType: "InvoiceSubmitted",
        label: "Invoice Submitted",
        icon: "description",
        invoiceId: "99",
        amount: "250",
        token: "XLM",
        dateLabel: "Jun 15, 11:00 AM",
        timestampMs: Date.parse("2025-06-15T11:00:00.000Z"),
      },
      sampleItems[0]!,
    ];

    mockUseRecentProtocolFeed.mockReturnValue({
      data: updatedItems,
      isLoading: false,
      isError: false,
    });

    rerender(<RecentTransactionsPanel />);

    await waitFor(() => {
      const newRow = screen.getAllByTestId("recent-transaction-item")[0];
      expect(newRow).toHaveAttribute("data-animate-new", "true");
      expect(newRow.className).toMatch(/slide-in-from-top/);
    });
  });
});
