"use client";

import React, { useState, useEffect, useMemo } from "react";

interface LastUpdatedProps {
  updatedAt: number | undefined;
}

function formatRelative(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatAbsolute(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LastUpdated({ updatedAt }: LastUpdatedProps) {
  // tick increments every refresh interval purely to trigger a re-render
  // and a fresh relative-time calculation; the value itself is unused.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!updatedAt) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60_000);

    return () => clearInterval(interval);
  }, [updatedAt]);

  const relative = useMemo(
    () => (updatedAt ? formatRelative(Date.now() - updatedAt) : null),
    [updatedAt, tick]
  );

  if (!updatedAt || relative === null) return null;

  const absolute = formatAbsolute(updatedAt);

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/70 font-medium px-6 py-2"
      title={absolute}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Last updated{" "}
      <time dateTime={new Date(updatedAt).toISOString()}>{relative}</time>
    </div>
  );
}
