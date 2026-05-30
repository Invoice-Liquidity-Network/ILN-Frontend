"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContractStats } from "@/hooks/useContractStats";
import { useInvoices } from "@/hooks/useInvoices";
import StatsMetricCards from "@/components/stats/StatsMetricCards";
import StatsVolumeChart from "@/components/stats/StatsVolumeChart";
import StatsTokenBreakdown from "@/components/stats/StatsTokenBreakdown";
import ProtocolYieldAnalyticsSection from "@/components/stats/ProtocolYieldAnalyticsSection";
import ErrorBoundary from "@/components/ErrorBoundary";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-[20px] border border-outline-variant/10 bg-surface-container-lowest"
          />
        ))}
      </div>
      <div className="h-72 rounded-[24px] border border-outline-variant/10 bg-surface-container-lowest" />
      <div className="h-64 rounded-[24px] border border-outline-variant/10 bg-surface-container-lowest" />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-error/20 bg-error-container/10 p-4 text-sm text-on-error-container">
      <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
        error
      </span>
      <span>Failed to load stats: {message}</span>
    </div>
  );
}

export default function ProtocolStatsScreen() {
  const { data: stats, isLoading, error } = useContractStats();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div>
            <h1 className="font-headline text-3xl font-bold text-on-surface">
              Protocol Statistics
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Live overview of the Invoice Liquidity Network — updates every 60 seconds.
            </p>
          </div>

          {isLoading && <LoadingSkeleton />}

          {!isLoading && error && (
            <ErrorBanner
              message={error instanceof Error ? error.message : "Unknown error"}
            />
          )}

          {!isLoading && !error && stats && (
            <ErrorBoundary>
              <StatsMetricCards stats={stats} />

              <StatsVolumeChart dailyVolume={stats.daily_volume} />

              <StatsTokenBreakdown
                tokens={stats.volume_by_token}
                totalUsd={stats.total_volume_usd}
              />

              <ProtocolYieldAnalyticsSection
                invoices={invoices}
                isLoading={invoicesLoading}
              />
            </ErrorBoundary>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
