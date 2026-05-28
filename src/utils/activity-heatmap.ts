import type { ContractEventType } from "@/lib/contract-events";
import type { Invoice } from "@/utils/soroban";

export interface AddressActivityRecord {
  date: string;
  count: number;
}

export interface ProfileActivityInput {
  type: ContractEventType | "submit" | "fund" | "paid";
  timestampMs: number;
}

const WEEKS = 52;
const DAYS_PER_WEEK = 7;

function toUtcDateKey(timestampMs: number): string {
  const date = new Date(timestampMs);
  return date.toISOString().slice(0, 10);
}

/** Aggregate activity counts per UTC day for the last 52 weeks. */
export function buildDailyActivityCounts(
  records: ProfileActivityInput[],
  now = Date.now(),
): Map<string, number> {
  const counts = new Map<string, number>();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - WEEKS * DAYS_PER_WEEK + 1);

  for (const record of records) {
    if (record.timestampMs < start.getTime()) continue;
    const key = toUtcDateKey(record.timestampMs);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

export function deriveAddressActivityFromInvoices(
  invoices: Invoice[],
  address: string,
): ProfileActivityInput[] {
  const activity: ProfileActivityInput[] = [];

  for (const invoice of invoices) {
    const timestampMs = Number(invoice.funded_at ?? invoice.due_date) * 1000;
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) continue;

    if (invoice.freelancer === address) {
      activity.push({ type: "submit", timestampMs });
    }
    if (invoice.funder === address) {
      activity.push({ type: "fund", timestampMs });
    }
    if (invoice.payer === address && invoice.status === "Paid") {
      activity.push({ type: "paid", timestampMs });
    }
  }

  return activity;
}

export function getHeatmapIntensityColor(count: number, maxCount: number): string {
  if (count <= 0 || maxCount <= 0) return "#ebedf0";
  const ratio = count / maxCount;
  if (ratio < 0.25) return "#9be9a8";
  if (ratio < 0.5) return "#40c463";
  if (ratio < 0.75) return "#30a14e";
  return "#216e39";
}

export function buildHeatmapGrid(
  counts: Map<string, number>,
  now = Date.now(),
): { weeks: string[][]; maxCount: number } {
  const totalDays = WEEKS * DAYS_PER_WEEK;
  const days: string[] = [];
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() - totalDays + 1);

  for (let i = 0; i < totalDays; i += 1) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  let maxCount = 0;
  const values = days.map((day) => {
    const count = counts.get(day) ?? 0;
    maxCount = Math.max(maxCount, count);
    return String(count);
  });

  const weeks: string[][] = [];
  for (let i = 0; i < values.length; i += DAYS_PER_WEEK) {
    weeks.push(values.slice(i, i + DAYS_PER_WEEK));
  }

  return { weeks, maxCount };
}

export function formatActivityTooltip(count: number, dateKey: string): string {
  const label = count === 1 ? "1 action" : `${count} actions`;
  const formatted = new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${label} on ${formatted}`;
}
