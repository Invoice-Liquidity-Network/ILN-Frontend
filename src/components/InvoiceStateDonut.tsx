"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import useInvoiceStateCounts from "@/hooks/useInvoiceStateCounts";

const STATES = ["PENDING", "FUNDED", "PAID", "EXPIRED", "CANCELLED", "DISPUTED"];

const COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  FUNDED: "#10b981",
  PAID: "#3b82f6",
  EXPIRED: "#ef4444",
  CANCELLED: "#6b7280",
  DISPUTED: "#a78bfa",
};

export default function InvoiceStateDonut() {
  const { counts, total, loading } = useInvoiceStateCounts();

  if (loading) return <div className="p-6 bg-surface-container-low rounded-lg">Loading...</div>;
  if (!counts) return <div className="p-6 bg-surface-container-low rounded-lg">No data</div>;

  const data = Object.keys(counts).map((k) => ({ name: k, value: counts[k], percent: total ? (counts[k] / total) * 100 : 0 }));

  return (
    <div className="p-6 bg-surface-container-low rounded-lg">
      <p className="text-xs font-bold uppercase tracking-widest mb-2">Invoice States</p>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2} label={null}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] ?? "#ddd"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => {
                const p = total ? ((value / total) * 100).toFixed(1) : "0";
                return [String(value), `${name} — ${p}%`];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <span style={{ width: 12, height: 12, background: COLORS[d.name] ?? "#ddd", display: "inline-block", borderRadius: 3 }} />
            <div className="text-sm">
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-on-surface-variant">{d.value} — {total ? ((d.value / total) * 100).toFixed(1) : "0"}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
