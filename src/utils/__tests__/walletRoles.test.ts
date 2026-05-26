import { describe, expect, it } from "vitest";
import { deriveWalletRoles } from "../walletRoles";
import type { Invoice } from "../soroban";

const ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const OTHER = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

function invoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 1n,
    status: "Pending",
    freelancer: OTHER,
    payer: OTHER,
    amount: 100n,
    due_date: 1n,
    discount_rate: 300,
    ...overrides,
  };
}

describe("deriveWalletRoles", () => {
  it("detects multiple roles from invoice history", () => {
    const summary = deriveWalletRoles(ADDRESS, [
      invoice({ id: 1n, freelancer: ADDRESS }),
      invoice({ id: 2n, payer: ADDRESS }),
      invoice({ id: 3n, funder: ADDRESS }),
      invoice({ id: 4n }),
    ]);

    expect(summary.roles).toEqual(["freelancer", "payer", "lp"]);
    expect(summary.submittedCount).toBe(1);
    expect(summary.payerCount).toBe(1);
    expect(summary.fundedCount).toBe(1);
  });

  it("returns no roles when the wallet has no invoice history", () => {
    const summary = deriveWalletRoles(ADDRESS, [invoice({ id: 1n })]);

    expect(summary.roles).toEqual([]);
    expect(summary.submittedCount).toBe(0);
    expect(summary.payerCount).toBe(0);
    expect(summary.fundedCount).toBe(0);
  });
});

