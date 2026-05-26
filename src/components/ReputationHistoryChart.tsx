"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ReputationRange,
  ReputationUpdatedEvent,
  buildReputationHistory,
  hasEnoughReputationHistory,
} from "@/utils/reputation-history";

const RANGES: Array<{ value: ReputationRange; label: string }> = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

export default function ReputationHistoryChart({
  events,
}: {
  events: ReputationUpdatedEvent[];
}) {
  const [range, setRange] = useState<ReputationRange>("90d");
  const points = useMemo(() => buildReputationHistory(events, range), [events, range]);

  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold">Reputation history</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            ReputationUpdated events over time.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((option) => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                range === option.value
                  ? "bg-primary text-white"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!hasEnoughReputationHistory(points) ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl bg-surface-container text-sm text-on-surface-variant">
          No history available
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ left: 8, right: 18, top: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${value}/100`,
                  `Score (${item.payload.eventType})`,
                ]}
                labelFormatter={(label, items) => {
                  const payload = items?.[0]?.payload;
                  if (!payload) return label;
                  return payload.ledger
                    ? `${label}`
                    : new Date(payload.timestamp * 1000).toLocaleString();
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-primary, #0f766e)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
