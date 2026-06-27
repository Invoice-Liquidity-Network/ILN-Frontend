"use client";

import dynamic from "next/dynamic";
import { useContractStats } from "@/hooks/useContractStats";

const InvoiceStateDonut = dynamic(() => import("@/components/InvoiceStateDonut"), {
  ssr: false,
  loading: () => <div className="p-6 bg-surface-container-low rounded-lg h-[340px] animate-pulse flex items-center justify-center text-sm text-on-surface-variant">Loading chart...</div>,
});

function formatUsd(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
}

export default function Stats() {
  const { data, isLoading } = useContractStats();

  const stats = [
    { label: "Total Invoices", value: data ? data.total_invoices.toLocaleString() : "0" },
    { label: "Volume", value: data ? formatUsd(data.total_volume_usd) : "$0" },
    { label: "Avg. Yield", value: "3.2%" }, // Hardcoded for now
    { label: "Active LPs", value: "89" }, // Hardcoded for now
  ];

  return (
    <section className="bg-surface-dim py-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-8">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="p-6 bg-surface-container-low rounded-lg md:col-span-1 min-h-[104px] animate-pulse flex flex-col justify-center">
                <div className="h-3 w-20 bg-surface-variant rounded mb-3" />
                <div className="h-8 w-16 bg-surface-variant rounded mt-1" />
              </div>
            ))}
          </>
        ) : (
          <>
            {stats.map((stat, index) => (
              <div key={index} className="p-6 bg-surface-container-low rounded-lg md:col-span-1 min-h-[104px] flex flex-col justify-center transition-all duration-300">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-headline font-medium text-primary leading-none">
                  {stat.value}
                </p>
              </div>
            ))}
          </>
        )}

        <div className="md:col-span-2">
          <InvoiceStateDonut />
        </div>
      </div>
    </section>
  );
}
