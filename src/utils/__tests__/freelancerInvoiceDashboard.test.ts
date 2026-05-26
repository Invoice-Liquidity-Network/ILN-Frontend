import { describe, expect, it } from "vitest";
import {
  buildFreelancerInvoiceDashboard,
  type FreelancerInvoiceStatusFilter,
} from "../freelancerInvoiceDashboard";
import type { Invoice } from "../soroban";

const SUBMITTER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const OTHER = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRY";

function invoice(overrides: Partial<Invoice> & Pick<Invoice, "id">): Invoice {
  return {
    id: overrides.id,
    freelancer: SUBMITTER,
    payer: `GPAYER${overrides.id.toString().padStart(2, "0")}`,
    amount: 100n * overrides.id,
    due_date: 1_800_000_000n + overrides.id,
    discount_rate: 300,
    status: "Pending",
    token: "token-usdc",
    ...overrides,
  };
}

function build(statusFilter: FreelancerInvoiceStatusFilter = "All", page = 1) {
  return buildFreelancerInvoiceDashboard({
    invoices: [
      invoice({ id: 1n, amount: 300n, due_date: 30n, status: "Paid" }),
      invoice({ id: 2n, amount: 100n, due_date: 10n, status: "Pending" }),
      invoice({ id: 3n, amount: 200n, due_date: 20n, status: "Funded", freelancer: OTHER }),
      invoice({ id: 4n, amount: 400n, due_date: 40n, status: "Pending" }),
    ],
    submitterAddress: SUBMITTER,
    statusFilter,
    sortKey: "due_date",
    sortDirection: "asc",
    page,
    pageSize: 2,
  });
}

describe("buildFreelancerInvoiceDashboard", () => {
  it("filters invoices to the connected submitter and sorts by due date", () => {
    const result = build();

    expect(result.total).toBe(3);
    expect(result.pageCount).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual([2n, 1n]);
  });

  it("filters by status and paginates safely", () => {
    const result = build("Pending", 5);

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual([2n, 4n]);
  });

  it("sorts by amount descending", () => {
    const result = buildFreelancerInvoiceDashboard({
      invoices: [invoice({ id: 1n, amount: 300n }), invoice({ id: 2n, amount: 100n })],
      submitterAddress: SUBMITTER,
      statusFilter: "All",
      sortKey: "amount",
      sortDirection: "desc",
      page: 1,
      pageSize: 20,
    });

    expect(result.items.map((item) => item.id)).toEqual([1n, 2n]);
  });
});
