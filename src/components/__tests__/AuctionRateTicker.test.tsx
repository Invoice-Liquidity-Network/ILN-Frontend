import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuctionRateTicker from "@/components/AuctionRateTicker";
import type { Invoice } from "@/utils/soroban";

const fixedInvoice: Invoice = {
  id: 1n,
  status: "Pending",
  freelancer: "GFR",
  payer: "GPY",
  amount: 10_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 500,
};

describe("AuctionRateTicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-26T16:20:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the standard discount badge for fixed-rate invoices", () => {
    render(<AuctionRateTicker invoice={fixedInvoice} />);

    expect(screen.getByText("5.00%")).toBeInTheDocument();
  });

  it("renders the live Dutch auction rate display", () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    render(
      <AuctionRateTicker
        invoice={{
          ...fixedInvoice,
          auction_mode: true,
          start_rate: 900,
          min_rate: 300,
          auction_started_at: BigInt(nowSeconds - 300),
          auction_ends_at: BigInt(nowSeconds + 300),
        }}
      />
    );

    expect(screen.getByLabelText("Dutch auction rate")).toBeInTheDocument();
    expect(screen.getByText("Current Rate: 600 bps")).toBeInTheDocument();
    expect(screen.getByText(/decreasing to 300 bps by/i)).toBeInTheDocument();
    expect(screen.getByText(/Act now - rate decreases in/i)).toBeInTheDocument();
  });

  it("shows the minimum-rate state after the auction completes", () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    render(
      <AuctionRateTicker
        invoice={{
          ...fixedInvoice,
          auction_mode: true,
          start_rate: 900,
          min_rate: 300,
          auction_started_at: BigInt(nowSeconds - 600),
          auction_ends_at: BigInt(nowSeconds - 1),
        }}
      />
    );

    expect(screen.getByText("Current Rate: 300 bps")).toBeInTheDocument();
    expect(screen.getByText("Minimum rate reached")).toBeInTheDocument();
  });
});
