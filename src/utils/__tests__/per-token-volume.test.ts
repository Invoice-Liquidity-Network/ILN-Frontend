import { describe, expect, it } from "vitest";
import { TESTNET_EURC_TOKEN_ID, TESTNET_XLM_TOKEN_ID } from "@/constants";
import type { Invoice } from "../soroban";
import { buildPerTokenVolumeData } from "../per-token-volume";

describe("buildPerTokenVolumeData", () => {
  it("builds weekly stacked USD-equivalent rows from contract stats", () => {
    const result = buildPerTokenVolumeData({
      now: new Date("2026-05-20T12:00:00Z"),
      rangeDays: 30,
      stats: {
        oracle_prices: { EURC: 1.1, XLM: 0.2 },
        weekly_per_token_volume: [
          {
            week_start: "2026-05-03",
            volumes: {
              USDC: "100000000",
              EURC: "100000000",
              XLM: "1000000000",
            },
          },
          {
            week_start: "2026-03-01",
            volumes: { USDC: "50000000" },
          },
        ],
      },
    });

    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0]).toMatchObject({
      weekStart: "2026-05-03",
      USDC: 100,
      EURC: 11,
      XLM: 20,
      totalUsd: 131,
    });
    expect(result.summary.totalUsd).toBe(131);
  });

  it("falls back to all-time per-token totals when weekly stats are unavailable", () => {
    const result = buildPerTokenVolumeData({
      now: new Date("2026-05-20T12:00:00Z"),
      rangeDays: 90,
      stats: {
        token_volumes: [
          { token: "USDC", total_volume: 250000000n },
          { token: TESTNET_EURC_TOKEN_ID, total_volume: 100000000n },
          { token: TESTNET_XLM_TOKEN_ID, total_volume: 2000000000n },
        ],
      },
    });

    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0].label).toBe("All-time");
    expect(result.summary.totals.USDC).toBe(250);
    expect(result.summary.totals.EURC).toBe(10.8);
    expect(result.summary.totals.XLM).toBe(30);
  });

  it("derives weekly rows from funded and paid invoices when stats are absent", () => {
    const fundedAt = Math.floor(new Date("2026-05-13T12:00:00Z").getTime() / 1000);
    const invoices: Invoice[] = [
      {
        id: 1n,
        status: "Funded",
        freelancer: "GFREELANCER",
        payer: "GPAYER",
        amount: 75000000n,
        due_date: 0n,
        funded_at: BigInt(fundedAt),
        discount_rate: 500,
        token: "USDC",
      },
      {
        id: 2n,
        status: "Pending",
        freelancer: "GFREELANCER",
        payer: "GPAYER",
        amount: 75000000n,
        due_date: 0n,
        discount_rate: 500,
        token: "USDC",
      },
    ];

    const result = buildPerTokenVolumeData({
      now: new Date("2026-05-20T12:00:00Z"),
      rangeDays: 30,
      invoices,
    });

    expect(result.buckets).toHaveLength(1);
    expect(result.summary.totalUsd).toBe(75);
    expect(result.summary.totals.USDC).toBe(75);
  });
});
