import { describe, expect, it } from "vitest";
import type { Invoice } from "@/utils/soroban";
import {
  applyLPRiskFilter,
  calculateLPRiskMetrics,
  getRiskSeverity,
  isAtRiskPosition,
} from "../lpRisk";

const NOW = Date.UTC(2026, 4, 26, 12, 0, 0);

function invoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 1n,
    status: "Funded",
    freelancer: "freelancer",
    payer: "payer",
    amount: 1000_0000000n,
    due_date: BigInt(Math.floor((NOW + 7 * 24 * 60 * 60 * 1000) / 1000)),
    discount_rate: 300,
    funder: "lp",
    ...overrides,
  };
}

describe("LP risk metrics", () => {
  it("marks disputed and funded positions due within 24 hours as at risk", () => {
    const disputed = invoice({ id: 1n, status: "Disputed" });
    const nearExpiry = invoice({
      id: 2n,
      due_date: BigInt(Math.floor((NOW + 23 * 60 * 60 * 1000) / 1000)),
    });
    const healthy = invoice({
      id: 3n,
      due_date: BigInt(Math.floor((NOW + 3 * 24 * 60 * 60 * 1000) / 1000)),
    });

    expect(isAtRiskPosition(disputed, NOW)).toBe(true);
    expect(isAtRiskPosition(nearExpiry, NOW)).toBe(true);
    expect(isAtRiskPosition(healthy, NOW)).toBe(false);
  });

  it("calculates counts and capital at risk from LP positions", () => {
    const invoices = [
      invoice({ id: 1n, amount: 500_0000000n, status: "Disputed" }),
      invoice({
        id: 2n,
        amount: 1200_0000000n,
        due_date: BigInt(Math.floor((NOW + 60 * 60 * 1000) / 1000)),
      }),
      invoice({ id: 3n, amount: 900_0000000n, status: "Paid" }),
    ];

    expect(calculateLPRiskMetrics(invoices, NOW)).toEqual({
      positionsAtRisk: 2,
      capitalAtRisk: 1700_0000000n,
      disputedPositions: 1,
    });
  });

  it("filters table positions for at-risk and disputed metrics", () => {
    const invoices = [
      invoice({ id: 1n, status: "Disputed" }),
      invoice({
        id: 2n,
        due_date: BigInt(Math.floor((NOW + 60 * 60 * 1000) / 1000)),
      }),
      invoice({ id: 3n, status: "Paid" }),
    ];

    expect(applyLPRiskFilter(invoices, "at-risk", NOW).map((item) => item.id)).toEqual([1n, 2n]);
    expect(applyLPRiskFilter(invoices, "disputed", NOW).map((item) => item.id)).toEqual([1n]);
    expect(applyLPRiskFilter(invoices, "all", NOW)).toHaveLength(3);
  });

  it("maps zero, low, and high metric counts to severity colours", () => {
    expect(getRiskSeverity(0)).toBe("green");
    expect(getRiskSeverity(2)).toBe("amber");
    expect(getRiskSeverity(3)).toBe("red");
  });
});
