import { describe, expect, it } from "vitest";
import {
  calculateDutchAuctionState,
  formatAuctionCountdown,
  getDutchAuctionTerms,
} from "@/utils/dutchAuction";
import type { Invoice } from "@/utils/soroban";

const baseInvoice: Invoice = {
  id: 1n,
  status: "Pending",
  freelancer: "GFR",
  payer: "GPY",
  amount: 10_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 500,
};

describe("Dutch auction utilities", () => {
  it("returns null for fixed-rate invoices", () => {
    expect(getDutchAuctionTerms(baseInvoice)).toBeNull();
  });

  it("extracts valid auction terms from invoice metadata", () => {
    expect(
      getDutchAuctionTerms({
        ...baseInvoice,
        auction_mode: true,
        start_rate: 800,
        min_rate: 300,
        auction_started_at: 1_000n,
        auction_ends_at: 2_000n,
      })
    ).toEqual({
      startRateBps: 800,
      minRateBps: 300,
      startedAt: 1_000,
      endsAt: 2_000,
    });
  });

  it("calculates the current rate from elapsed ledger time", () => {
    const state = calculateDutchAuctionState(
      {
        startRateBps: 900,
        minRateBps: 300,
        startedAt: 1_000,
        endsAt: 1_600,
      },
      1_300
    );

    expect(state.currentRateBps).toBe(600);
    expect(state.progressPercent).toBe(50);
    expect(state.isComplete).toBe(false);
  });

  it("clamps the rate at the minimum once the auction ends", () => {
    const state = calculateDutchAuctionState(
      {
        startRateBps: 900,
        minRateBps: 300,
        startedAt: 1_000,
        endsAt: 1_600,
      },
      1_700
    );

    expect(state.currentRateBps).toBe(300);
    expect(state.progressPercent).toBe(100);
    expect(state.isComplete).toBe(true);
  });

  it("formats the next decrease countdown", () => {
    expect(formatAuctionCountdown(125)).toBe("2m 5s");
  });
});
