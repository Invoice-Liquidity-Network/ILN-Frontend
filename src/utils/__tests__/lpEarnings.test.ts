import { describe, expect, it } from "vitest";
import type { Invoice } from "@/utils/soroban";
import {
  buildLPEarningsCsv,
  buildLPEarningsRows,
  getLPEarningsExportFilename,
} from "../lpEarnings";

function invoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 1n,
    status: "Paid",
    freelancer: "freelancer",
    payer: "payer",
    amount: 1000_0000000n,
    due_date: 1_800_000_000n,
    discount_rate: 300,
    funder: "lp",
    funded_at: 1_801_000_000n,
    token: "usdc-token",
    ...overrides,
  };
}

const tokenMap = new Map([
  ["usdc-token", { contractId: "usdc-token", symbol: "USDC", decimals: 7 }],
  ["eurc-token", { contractId: "eurc-token", symbol: "EURC", decimals: 7 }],
]);

describe("LP earnings history", () => {
  it("builds newest-first rows for paid invoices only", () => {
    const rows = buildLPEarningsRows(
      [
        invoice({ id: 1n, funded_at: 1_701_000_000n }),
        invoice({ id: 2n, status: "Funded", funded_at: 1_901_000_000n }),
        invoice({ id: 3n, funded_at: 1_801_000_000n, token: "eurc-token" }),
      ],
      tokenMap,
      null,
    );

    expect(rows.map((row) => row.invoiceId)).toEqual(["3", "1"]);
    expect(rows[0]).toMatchObject({
      token: "EURC",
      amountFunded: "970 EURC",
      payoutReceived: "1,000 EURC",
      earned: "30 EURC",
      yieldPercent: "3.00%",
    });
  });

  it("exports all rows to CSV with the required headers", () => {
    const rows = buildLPEarningsRows([invoice({ id: 7n })], tokenMap, null);
    const csv = buildLPEarningsCsv(rows);

    expect(csv.split("\n")[0]).toBe(
      "Invoice ID,Payer,Settlement Date,Amount Funded,Payout Received,Earned,Token,Yield %",
    );
    expect(csv).toContain('"7","payer"');
    expect(csv).toContain('"30 USDC"');
  });

  it("uses the requested ILN-LP-Earnings date filename", () => {
    expect(getLPEarningsExportFilename(new Date("2026-05-26T09:00:00Z"))).toBe(
      "ILN-LP-Earnings-2026-05-26.csv",
    );
  });
});
