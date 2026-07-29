import type { ContractEventType } from '@/lib/contract-events';
import type { Invoice } from '@/utils/soroban';

export interface DayActivity {
  count: number;
  totalAmount: bigint;
}

export interface AddressActivityRecord {
  date: string;
  count: number;
}

export interface ProfileActivityInput {
  type: ContractEventType | 'submit' | 'fund' | 'paid';
  timestampMs: number;
  amount?: bigint;
}

const WEEKS = 52;
const DAYS_PER_WEEK = 7;

function toUtcDateKey(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

/** Aggregate activity counts and total amounts per UTC day for the last 52 weeks. */
export function buildDailyActivityCounts(
  records: ProfileActivityInput[],
  now = Date.now()
): Map<string, DayActivity> {
  const activity = new Map<string, DayActivity>();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - WEEKS * DAYS_PER_WEEK + 1);

  for (const record of records) {
    if (record.timestampMs < start.getTime()) continue;
    const key = toUtcDateKey(record.timestampMs);
    const existing = activity.get(key) ?? { count: 0, totalAmount: 0n };
    activity.set(key, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + (record.amount ?? 0n),
    });
  }

  return activity;
}

export function deriveAddressActivityFromInvoices(
  invoices: Invoice[],
  address: string
): ProfileActivityInput[] {
  const activity: ProfileActivityInput[] = [];

  for (const invoice of invoices) {
    const timestampMs = Number(invoice.funded_at ?? invoice.due_date) * 1000;
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) continue;

    if (invoice.freelancer === address) {
      activity.push({ type: 'submit', timestampMs, amount: invoice.amount });
    }
    if (invoice.funder === address) {
      activity.push({ type: 'fund', timestampMs, amount: invoice.amount });
    }
    if (invoice.payer === address && invoice.status === 'Paid') {
      activity.push({ type: 'paid', timestampMs, amount: invoice.amount });
    }
  }

  return activity;
}

const HEATMAP_COLORS = {
  empty: '#ebedf0',
  level1: '#9be9a8',
  level2: '#40c463',
  level3: '#30a14e',
  level4: '#216e39',
} as const;

export function getHeatmapIntensityColor(count: number, maxCount: number): string {
  if (count <= 0 || maxCount <= 0) return HEATMAP_COLORS.empty;
  const ratio = count / maxCount;
  if (ratio < 0.25) return HEATMAP_COLORS.level1;
  if (ratio < 0.5) return HEATMAP_COLORS.level2;
  if (ratio < 0.75) return HEATMAP_COLORS.level3;
  return HEATMAP_COLORS.level4;
}

export { HEATMAP_COLORS };

export function buildHeatmapGrid(
  activity: Map<string, DayActivity>,
  now = Date.now()
): { weeks: number[][]; maxCount: number; dayActivity: Map<string, DayActivity> } {
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
    const count = activity.get(day)?.count ?? 0;
    maxCount = Math.max(maxCount, count);
    return count;
  });

  const weeks: number[][] = [];
  for (let i = 0; i < values.length; i += DAYS_PER_WEEK) {
    weeks.push(values.slice(i, i + DAYS_PER_WEEK));
  }

  return { weeks, maxCount, dayActivity: activity };
}

export function formatActivityTooltip(activity: DayActivity, dateKey: string): string {
  const formatted = new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (activity.count === 0) return `No activity on ${formatted}`;

  const label = activity.count === 1 ? '1 action' : `${activity.count} actions`;

  if (activity.totalAmount > 0n) {
    const amount = (Number(activity.totalAmount) / 1e7).toFixed(2);
    return `${label} on ${formatted} · ${amount} total`;
  }

  return `${label} on ${formatted}`;
}
