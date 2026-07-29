'use client';

import { useMemo, useState } from 'react';
import type { Invoice } from '@/utils/soroban';
import {
  type DayActivity,
  buildDailyActivityCounts,
  buildHeatmapGrid,
  deriveAddressActivityFromInvoices,
  formatActivityTooltip,
  getHeatmapIntensityColor,
} from '@/utils/activity-heatmap';

interface ActivityHeatmapProps {
  address: string;
  invoices: Invoice[];
}

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;

interface TooltipState {
  dayKey: string;
  activity: DayActivity;
  weekIndex: number;
  dayIndex: number;
}

export default function ActivityHeatmap({ address, invoices }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { weeks, maxCount, dayKeys, dayActivity } = useMemo(() => {
    const activity = deriveAddressActivityFromInvoices(invoices, address);
    const counts = buildDailyActivityCounts(activity);
    const grid = buildHeatmapGrid(counts);
    const keys: string[] = [];
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    cursor.setUTCDate(cursor.getUTCDate() - 52 * 7 + 1);
    for (let i = 0; i < 52 * 7; i += 1) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { ...grid, dayKeys: keys };
  }, [address, invoices]);

  const svgWidth = weeks.length * STEP;
  const svgHeight = 7 * STEP;

  const showTooltip = (weekIndex: number, dayIndex: number, dayKey: string) => {
    const activity = dayActivity.get(dayKey) ?? { count: 0, totalAmount: 0n };
    setTooltip({ dayKey, activity, weekIndex, dayIndex });
  };

  const hideTooltip = () => setTooltip(null);

  // Position tooltip above the cell; clamp left so it stays within the SVG width.
  const TOOLTIP_WIDTH = 160;
  const tooltipStyle = tooltip
    ? {
        left: Math.min(tooltip.weekIndex * STEP, svgWidth - TOOLTIP_WIDTH),
        top: Math.max(0, tooltip.dayIndex * STEP - 72),
      }
    : undefined;

  const formattedDate = tooltip
    ? new Date(`${tooltip.dayKey}T00:00:00Z`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <section
      className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6"
      aria-label="On-chain activity heatmap"
    >
      <h2 className="text-xl font-semibold text-on-surface">Activity heatmap</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Daily on-chain actions (submit, fund, mark paid) over the last 52 weeks.
      </p>

      <div className="mt-6 overflow-x-auto">
        <div className="relative inline-block">
          <svg
            width={svgWidth}
            height={svgHeight}
            role="img"
            aria-label="GitHub-style activity heatmap for the last 52 weeks"
          >
            {weeks.map((week, weekIndex) =>
              week.map((count, dayIndex) => {
                const dayKey =
                  dayKeys[weekIndex * 7 + dayIndex] ?? new Date().toISOString().slice(0, 10);
                const cellActivity = dayActivity.get(dayKey) ?? { count: 0, totalAmount: 0n };
                return (
                  <rect
                    key={`${weekIndex}-${dayIndex}`}
                    x={weekIndex * STEP}
                    y={dayIndex * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={getHeatmapIntensityColor(count, maxCount)}
                    tabIndex={0}
                    role="gridcell"
                    aria-label={formatActivityTooltip(cellActivity, dayKey)}
                    style={{ outline: 'none', cursor: 'default' }}
                    onMouseEnter={() => showTooltip(weekIndex, dayIndex, dayKey)}
                    onMouseLeave={hideTooltip}
                    onFocus={() => showTooltip(weekIndex, dayIndex, dayKey)}
                    onBlur={hideTooltip}
                  />
                );
              })
            )}
          </svg>

          {tooltip && (
            <div
              role="tooltip"
              data-testid="heatmap-tooltip"
              className="pointer-events-none absolute z-50 min-w-[140px] rounded-xl border border-outline-variant/20 bg-surface-container-highest px-3 py-2 shadow-lg"
              style={tooltipStyle}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {formattedDate}
              </p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {tooltip.activity.count === 0
                  ? 'No activity'
                  : tooltip.activity.count === 1
                    ? '1 action'
                    : `${tooltip.activity.count} actions`}
              </p>
              {tooltip.activity.totalAmount > 0n && (
                <p className="mt-0.5 text-xs font-medium text-primary">
                  {(Number(tooltip.activity.totalAmount) / 1e7).toFixed(2)} total
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
