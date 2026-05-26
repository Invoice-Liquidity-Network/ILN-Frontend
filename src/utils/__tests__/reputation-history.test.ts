import { describe, expect, it } from "vitest";
import { buildReputationHistory, hasEnoughReputationHistory } from "../reputation-history";

const NOW = Date.UTC(2026, 4, 26);

describe("reputation history", () => {
  it("builds sorted score history from ReputationUpdated events", () => {
    const points = buildReputationHistory(
      [
        { type: "ReputationUpdated", score: 80, eventType: "paid", timestamp: 100 },
        { type: "ReputationUpdated", score: 62, eventType: "defaulted", timestamp: 50 },
      ],
      "all",
      NOW,
    );

    expect(points.map((point) => point.score)).toEqual([62, 80]);
    expect(points[0].eventType).toBe("defaulted");
  });

  it("filters to the selected time range", () => {
    const recent = Math.floor((NOW - 10 * 86_400_000) / 1000);
    const old = Math.floor((NOW - 40 * 86_400_000) / 1000);
    const points = buildReputationHistory(
      [
        { type: "ReputationUpdated", score: 90, eventType: "paid", timestamp: recent },
        { type: "ReputationUpdated", score: 40, eventType: "decay", timestamp: old },
      ],
      "30d",
      NOW,
    );

    expect(points).toHaveLength(1);
    expect(points[0].score).toBe(90);
  });

  it("requires at least two data points", () => {
    expect(hasEnoughReputationHistory([])).toBe(false);
    expect(hasEnoughReputationHistory([{ score: 90, eventType: "paid", timestamp: 1, label: "A" }])).toBe(false);
  });
});
