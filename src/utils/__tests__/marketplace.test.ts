import { describe, expect, it } from "vitest";
import {
  filterMarketplaceInvoices,
  paginateMarketplaceInvoices,
  sortMarketplaceInvoices,
} from "../marketplace";
import type { Invoice } from "../soroban";

function invoice(id: number, overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: BigInt(id),
    status: "Pending",
    freelancer: "GFREELANCER",
    payer: `GPAYER${id}`,
    amount: BigInt(id * 100_000_000),
    due_date: BigInt(1_800_000_000 + id),
    discount_rate: id * 100,
    token: "USDC",
    ...overrides,
  };
}

describe("marketplace utilities", () => {
  it("filters pending invoices by token, yield, amount, and reputation", () => {
    const scores = new Map([
      ["GPAYER1", { score: 30, settled_on_time: 0, defaults: 1 }],
      ["GPAYER2", { score: 90, settled_on_time: 4, defaults: 0 }],
    ]);

    const result = filterMarketplaceInvoices({
      invoices: [
        invoice(1, { token: "USDC", discount_rate: 300 }),
        invoice(2, { token: "USDC", discount_rate: 700 }),
        invoice(3, { token: "EURC", discount_rate: 900 }),
        invoice(4, { status: "Funded", discount_rate: 1_000 }),
      ],
      payerScores: scores,
      filters: {
        token: "USDC",
        minYield: 5,
        maxAmount: "25",
        minReputation: 80,
      },
    });

    expect(result.map((item) => item.id)).toEqual([2n]);
  });

  it("sorts and paginates invoices", () => {
    const invoices = [invoice(1), invoice(3), invoice(2)];
    expect(sortMarketplaceInvoices(invoices, "yield").map((item) => item.id)).toEqual([3n, 2n, 1n]);
    expect(paginateMarketplaceInvoices(invoices, 1, 2).map((item) => item.id)).toEqual([2n]);
  });
});
