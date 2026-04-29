"use client";

import { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";

type Funder = {
  address: string;
  fundedCount: number;
  avgDiscountRate: number;
};

const CACHE_KEY = "iln_top_funders_30d";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function truncateAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeFunders(data: unknown): Funder[] {
  if (!Array.isArray(data)) return [];
  return data.slice(0, 5).map((item: any) => ({
    address: String(item.address ?? item.lp ?? ""),
    fundedCount: Number(item.fundedCount ?? item.metric1 ?? 0),
    avgDiscountRate: Number(item.avgDiscountRate ?? item.metric2 ?? 0),
  })).filter((row) => row.address.length > 0);
}

export default function TopFundersWidget() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<Funder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as { savedAt: number; rows: Funder[] };
          if (Date.now() - cached.savedAt < CACHE_TTL_MS) {
            setRows(cached.rows);
            setLoading(false);
            return;
          }
        }

        const response = await fetch("/api/leaderboard?type=lp&period=30d&limit=5", { cache: "no-store" });
        const data = await response.json();
        const normalized = normalizeFunders(data);
        setRows(normalized);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows: normalized }));
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      addToast({
        type: "success",
        title: "Address copied",
        message: "LP address copied to clipboard.",
      });
    } catch {
      addToast({
        type: "error",
        title: "Copy failed",
        message: "Could not copy LP address.",
      });
    }
  };

  return (
    <section className="mt-6 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-xl" aria-label="Top funders">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant">
        Active liquidity providers on ILN
      </h2>

      {loading && <p className="mt-3 text-sm text-on-surface-variant">Loading active LPs...</p>}

      {!loading && rows.length === 0 && (
        <p className="mt-3 text-sm text-on-surface-variant">No active LP leaderboard data is available right now.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div key={row.address} className="rounded-xl border border-outline-variant/15 bg-surface p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => copyAddress(row.address)}
                  className="font-mono text-sm font-semibold text-primary transition-opacity hover:opacity-80"
                >
                  {index + 1}. {truncateAddress(row.address)}
                </button>
                <span className="text-sm text-on-surface">
                  {row.fundedCount} invoices (30d)
                </span>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">
                Avg discount accepted: {row.avgDiscountRate.toFixed(2)}%
              </p>
              <p className="mt-1 text-xs text-on-surface-variant/80">
                This LP typically funds invoices with {row.avgDiscountRate.toFixed(2)}% discount rate or lower.
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
