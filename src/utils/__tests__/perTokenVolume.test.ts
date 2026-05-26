import { describe, expect, it } from "vitest";
import { transformPerTokenVolumeStats } from "../perTokenVolume";

const NOW = new Date("2026-05-26T12:00:00Z");

describe("transformPerTokenVolumeStats", () => {
  it("aggregates token rows into weekly USD-equivalent stacked buckets", () => {
    const result = transformPerTokenVolumeStats(
      {
        oracle_prices: { USDC: 1, EURC: 1.1, XLM: 0.1 },
        per_token_weekly_volume: [
          { week: "2026-05-20", token: "USDC", amount: 1000 },
          { week: "2026-05-20", token: "EURC", amount: 500 },
          { week: "2026-05-20", token: "XLM", amount: 2000 },
          { week: "2026-05-13", token: "USDC", volume_usd: 250 },
        ],
      },
      "30D",
      NOW,
    );

    expect(result.buckets).toHaveLength(2);
    expect(result.buckets[1]).toMatchObject({
      weekStart: "2026-05-18",
      USDC: 1000,
      EURC: 550,
      XLM: 200,
      totalUsd: 1750,
    });
    expect(result.summary).toMatchObject({
      totalUsd: 2000,
      USDC: 1250,
      EURC: 550,
      XLM: 200,
    });
  });

  it("filters buckets to the selected 30 or 90 day range", () => {
    const raw = {
      weeklyTokenVolume: [
        { weekStart: "2026-05-18", USDC: 100 },
        { weekStart: "2026-04-20", USDC: 200 },
        { weekStart: "2026-03-02", USDC: 300 },
      ],
    };

    expect(transformPerTokenVolumeStats(raw, "30D", NOW).buckets.map((b) => b.USDC)).toEqual([100]);
    expect(transformPerTokenVolumeStats(raw, "90D", NOW).buckets.map((b) => b.USDC)).toEqual([
      300,
      200,
      100,
    ]);
  });

  it("falls back to flat per-token all-time fields when weekly rows are absent", () => {
    const result = transformPerTokenVolumeStats(
      {
        indexed_at: "2026-05-26T09:00:00Z",
        usdc_volume_funded: 1200,
        eurc_volume_usd: 700,
        xlm_volume: 1000,
        prices_usd: { XLM: 0.15 },
      },
      "30D",
      NOW,
    );

    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0]).toMatchObject({
      weekStart: "2026-05-25",
      USDC: 1200,
      EURC: 700,
      XLM: 150,
      totalUsd: 2050,
    });
    expect(result.summary.totalUsd).toBe(2050);
  });
});
