import { describe, expect, it } from "vitest";
import { applyInvoiceFilters, EMPTY_INVOICE_FILTERS, type InvoiceFilters } from "../useInvoiceFilters";
import type { Invoice } from "@/utils/soroban";

function invoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 1n,
    freelancer: "GFREELANCER1111111111111111111111111111111111111111",
    payer: "GPAYER11111111111111111111111111111111111111111111",
    amount: 100_0000000n,
    due_date: 1_767_225_600n,
    discount_rate: 300,
    status: "Pending",
    token: "usdc-contract",
    ...overrides,
  };
}

function filters(overrides: Partial<InvoiceFilters>): InvoiceFilters {
  return { ...EMPTY_INVOICE_FILTERS, ...overrides };
}

function unixDate(year: number, month: number, day: number): bigint {
  return BigInt(Date.UTC(year, month - 1, day) / 1000);
}

describe("applyInvoiceFilters", () => {
  it("matches invoice ID, payer, and freelancer search terms", () => {
    const invoices = [
      invoice({ id: 42n, payer: "GPAYERABC", freelancer: "GFREELANCERXYZ" }),
      invoice({ id: 7n, payer: "GOTHER", freelancer: "GWORKER" }),
    ];

    expect(applyInvoiceFilters(invoices, filters({ search: "42" })).map((item) => item.id)).toEqual([42n]);
    expect(applyInvoiceFilters(invoices, filters({ search: "payerabc" })).map((item) => item.id)).toEqual([42n]);
    expect(applyInvoiceFilters(invoices, filters({ search: "worker" })).map((item) => item.id)).toEqual([7n]);
  });

  it("filters by amount range, status, due date, and discount bps", () => {
    const invoices = [
      invoice({ id: 1n, amount: 50_0000000n, status: "Pending", due_date: unixDate(2026, 1, 15), discount_rate: 200 }),
      invoice({ id: 2n, amount: 150_0000000n, status: "Paid", due_date: unixDate(2026, 2, 15), discount_rate: 500 }),
      invoice({ id: 3n, amount: 250_0000000n, status: "Defaulted", due_date: unixDate(2026, 3, 1), discount_rate: 800 }),
    ];

    const result = applyInvoiceFilters(
      invoices,
      filters({
        statuses: ["Paid", "Defaulted"],
        minAmount: "100",
        maxAmount: "260",
        startDate: "2026-02-01",
        endDate: "2026-03-15",
        minDiscountBps: "400",
        maxDiscountBps: "900",
      }),
    );

    expect(result.map((item) => item.id)).toEqual([2n, 3n]);
  });

  it("supports multi-token filters through a comma-separated token query value", () => {
    const invoices = [
      invoice({ id: 1n, token: "usdc-contract" }),
      invoice({ id: 2n, token: "eurc-contract" }),
      invoice({ id: 3n, token: "xlm-contract" }),
    ];

    const result = applyInvoiceFilters(
      invoices,
      filters({ token: "USDC,EURC" }),
      {
        resolveTokenSymbol: (item) => {
          if (item.token === "eurc-contract") return "EURC";
          if (item.token === "xlm-contract") return "XLM";
          return "USDC";
        },
      },
    );

    expect(result.map((item) => item.id)).toEqual([1n, 2n]);
  });
});
