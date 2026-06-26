"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ActivityPoint {
  period: string;
  score: number;
}

interface ProfileActivityChartProps {
  data: ActivityPoint[];
}

const CHART_TICK_STYLE = {
  fill: "#64748b",
  fontSize: 11,
};

export default function ProfileActivityChart({ data }: ProfileActivityChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Score history</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Reputation score changes from on-chain event history.
          </p>
        </div>
      </div>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
            />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} name="Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
