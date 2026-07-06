"use client";

import React, { useState, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "all";
type ActivityType = "all" | "submissions" | "funding" | "payments";

interface ActivityPoint {
  period: string;
  submissions?: number;
  funding?: number;
  payments?: number;
}

interface ProfileActivityChartProps {
  data: ActivityPoint[];
}

const CHART_TICK_STYLE = {
  fill: "#64748b",
  fontSize: 11,
};

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

const ACTIVITY_TYPES: { value: ActivityType; label: string; color: string }[] = [
  { value: "all", label: "All Activity", color: "#0ea5e9" },
  { value: "submissions", label: "Submissions", color: "#8b5cf6" },
  { value: "funding", label: "Funding", color: "#10b981" },
  { value: "payments", label: "Payments", color: "#f59e0b" },
];

export default function ProfileActivityChart({ data }: ProfileActivityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activityType, setActivityType] = useState<ActivityType>("all");
  const chartRef = useRef<HTMLDivElement>(null);

  const filterDataByTimeRange = (data: ActivityPoint[], range: TimeRange): ActivityPoint[] => {
    if (range === "all") return data;
    const days = parseInt(range);
    return data.slice(-days);
  };

  const filterDataByActivityType = (data: ActivityPoint[], type: ActivityType): ActivityPoint[] => {
    if (type === "all") return data;
    return data.map((point) => ({
      period: point.period,
      [type]: point[type],
    }));
  };

  const filteredData = filterDataByActivityType(
    filterDataByTimeRange(data, timeRange),
    activityType
  );

  const handleExportAsPNG = () => {
    if (!chartRef.current) return;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgElement = chartRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = svgElement.clientWidth * 2;
      canvas.height = svgElement.clientHeight * 2;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement("a");
      link.download = `activity-chart-${timeRange}-${activityType}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Activity History</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Track your submissions, funding, and payments over time.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeRange === range.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {ACTIVITY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setActivityType(type.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activityType === type.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleExportAsPNG}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            Export
          </button>
        </div>
      </div>

      <div className="mt-6 h-72 w-full" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 20, right: 16, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
            />
            <Legend />
            {activityType === "all" || activityType === "submissions" ? (
              <Bar dataKey="submissions" stackId="activity" fill="#8b5cf6" name="Submissions" />
            ) : null}
            {activityType === "all" || activityType === "funding" ? (
              <Bar dataKey="funding" stackId="activity" fill="#10b981" name="Funding" />
            ) : null}
            {activityType === "all" || activityType === "payments" ? (
              <Bar dataKey="payments" stackId="activity" fill="#f59e0b" name="Payments" />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
