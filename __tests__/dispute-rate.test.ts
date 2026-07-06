import { describe, it, expect } from "vitest";
import type { ParsedContractEvent } from "@/lib/contract-events";
import {
  computeDisputeRateMetrics,
  getDisputeRateColor,
  getDisputeRateColorClasses,
} from "@/utils/dispute-rate";

const NOW = Date.parse("2025-06-15T12:00:00.000Z");

function fundedAt(iso: string): ParsedContractEvent {
  return { type: "InvoiceFunded", createdAt: iso, invoiceId: 1n };
}

function disputedAt(iso: string): ParsedContractEvent {
  return { type: "InvoiceDisputed", createdAt: iso, invoiceId: 2n };
}

describe("getDisputeRateColor", () => {
  it("returns green below 1%", () => {
    expect(getDisputeRateColor(0)).toBe("green");
    expect(getDisputeRateColor(0.99)).toBe("green");
  });

  it("returns amber from 1% through 5%", () => {
    expect(getDisputeRateColor(1)).toBe("amber");
    expect(getDisputeRateColor(3)).toBe("amber");
    expect(getDisputeRateColor(5)).toBe("amber");
  });

  it("returns red above 5%", () => {
    expect(getDisputeRateColor(5.01)).toBe("red");
    expect(getDisputeRateColor(10)).toBe("red");
  });
});

describe("getDisputeRateColorClasses", () => {
  it("maps each tone to display classes and sparkline stroke", () => {
    expect(getDisputeRateColorClasses("green").sparkline).toBe("#16a34a");
    expect(getDisputeRateColorClasses("amber").sparkline).toBe("#d97706");
    expect(getDisputeRateColorClasses("red").sparkline).toBe("#dc2626");
  });
});

describe("computeDisputeRateMetrics", () => {
  it("computes 30-day rate as disputed divided by funded events", () => {
    const events: ParsedContractEvent[] = [
      fundedAt("2025-06-10T00:00:00.000Z"),
      fundedAt("2025-06-11T00:00:00.000Z"),
      fundedAt("2025-06-12T00:00:00.000Z"),
      fundedAt("2025-06-13T00:00:00.000Z"),
      disputedAt("2025-06-14T00:00:00.000Z"),
    ];

    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.funded30d).toBe(4);
    expect(metrics.disputed30d).toBe(1);
    expect(metrics.rate30dPercent).toBeCloseTo(25, 5);
  });

  it("returns zero rate when no funded events in the last 30 days", () => {
    const metrics = computeDisputeRateMetrics([], NOW);
    expect(metrics.rate30dPercent).toBe(0);
    expect(metrics.funded30d).toBe(0);
    expect(metrics.disputed30d).toBe(0);
  });

  it("builds 90 daily trend points with per-day rates", () => {
    const events: ParsedContractEvent[] = [
      fundedAt("2025-06-01T00:00:00.000Z"),
      fundedAt("2025-06-01T12:00:00.000Z"),
      disputedAt("2025-06-01T18:00:00.000Z"),
    ];

    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.dailyTrend90d).toHaveLength(90);

    const june1 = metrics.dailyTrend90d.find((d) => d.date === "2025-06-01");
    expect(june1?.fundedCount).toBe(2);
    expect(june1?.disputedCount).toBe(1);
    expect(june1?.ratePercent).toBeCloseTo(50, 5);
  });

  it("excludes events older than 90 days from the trend", () => {
    const events: ParsedContractEvent[] = [fundedAt("2025-02-01T00:00:00.000Z")];
    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.funded30d).toBe(0);
    expect(metrics.dailyTrend90d.every((d) => d.fundedCount === 0)).toBe(true);
  });
});
