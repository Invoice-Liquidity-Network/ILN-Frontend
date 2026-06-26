"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { Invoice } from "@/utils/soroban";
import { PayerScore } from "@/utils/risk";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { formatAddress, formatTokenAmount } from "@/utils/format";
import {
  InvoiceRiskDetail,
  RiskTrendData,
  RISK_FACTOR_EXPLANATIONS,
} from "@/utils/riskCalculations";

interface LPRiskSummaryPanelProps {
  invoices: Invoice[];
  payerScores: Map<string, PayerScore> | null;
  isLoading?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ef4444",
  Unknown: "#6b7280",
};

export default function LPRiskSummaryPanel({
  invoices,
  payerScores,
  isLoading = false,
}: LPRiskSummaryPanelProps) {
  const { invoiceRisks, portfolioMetrics, trendData } = useRiskAnalysis({
    invoices,
    payerScores,
  });

  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(
    new Set(),
  );
  const [sortKey, setSortKey] = useState<"risk" | "amount" | "age">("risk");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedInvoiceRisks = useMemo(() => {
    const sorted = [...invoiceRisks];
    sorted.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortKey) {
        case "risk":
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case "amount":
          aValue = Number(a.amount);
          bValue = Number(b.amount);
          break;
        case "age":
          aValue = a.riskFactors.fundingAge;
          bValue = b.riskFactors.fundingAge;
          break;
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
    return sorted;
  }, [invoiceRisks, sortKey, sortOrder]);

  const riskDistribution = useMemo(() => {
    return [
      {
        name: "Low",
        value: portfolioMetrics.lowRiskCount,
        color: RISK_COLORS.Low,
      },
      {
        name: "Medium",
        value: portfolioMetrics.mediumRiskCount,
        color: RISK_COLORS.Medium,
      },
      {
        name: "High",
        value: portfolioMetrics.highRiskCount,
        color: RISK_COLORS.High,
      },
      {
        name: "Unknown",
        value: portfolioMetrics.unknownRiskCount,
        color: RISK_COLORS.Unknown,
      },
    ].filter((d) => d.value > 0);
  }, [portfolioMetrics]);

  const handleExportPDF = async () => {
    // Generate PDF export
    const reportData = {
      generatedAt: new Date().toISOString(),
      portfolioOverview: {
        totalInvoices: invoiceRisks.length,
        totalFunded: portfolioMetrics.totalFunded,
        averageRiskScore: portfolioMetrics.averageRiskScore,
        riskDistribution: {
          low: portfolioMetrics.lowRiskCount,
          medium: portfolioMetrics.mediumRiskCount,
          high: portfolioMetrics.highRiskCount,
        },
      },
      invoiceRisks: sortedInvoiceRisks,
      trendData: trendData,
    };

    // Create a simple CSV/JSON export for now (PDF would require additional library)
    const jsonStr = JSON.stringify(reportData, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-lg border border-surface-container-high p-6 animate-pulse">
        <div className="h-8 bg-surface-container-high rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-surface-container-high rounded" />
          <div className="h-20 bg-surface-container-high rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-surface-container-low rounded-lg border border-surface-container-high p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Risk Summary
          </h2>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            aria-label="Export risk report"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface rounded-lg p-4 border border-surface-container-high">
            <div className="text-xs font-medium text-on-surface-variant mb-1">
              Total Invoices
            </div>
            <div className="text-2xl font-bold">{invoiceRisks.length}</div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-surface-container-high">
            <div className="text-xs font-medium text-on-surface-variant mb-1">
              Avg Risk Score
            </div>
            <div className="text-2xl font-bold">
              {portfolioMetrics.averageRiskScore.toFixed(1)}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              out of 100
            </div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-surface-container-high">
            <div className="text-xs font-medium text-on-surface-variant mb-1">
              High Risk
            </div>
            <div className="text-2xl font-bold text-red-600">
              {portfolioMetrics.highRiskCount}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              {invoiceRisks.length > 0
                ? (
                    (portfolioMetrics.highRiskCount / invoiceRisks.length) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-surface-container-high">
            <div className="text-xs font-medium text-on-surface-variant mb-1">
              Total Funded
            </div>
            <div className="text-2xl font-bold">
              ${(Number(portfolioMetrics.totalFunded) / 1e7).toFixed(2)}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">USDC</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Risk Distribution Pie Chart */}
          <div className="bg-surface rounded-lg p-4 border border-surface-container-high">
            <h3 className="text-sm font-semibold mb-4">Risk Distribution</h3>
            {riskDistribution.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-on-surface-variant">
                No risk data available
              </div>
            )}
          </div>

          {/* Historical Trend Chart */}
          <div className="bg-surface rounded-lg p-4 border border-surface-container-high">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Risk Trend (30 Days)
            </h3>
            {trendData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      interval={Math.floor(trendData.length / 4)}
                    />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="averageRisk"
                      stroke={RISK_COLORS.Medium}
                      strokeWidth={2}
                      dot={false}
                      name="Avg Risk Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-on-surface-variant">
                No trend data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-Invoice Risk Breakdown */}
      <div className="bg-surface-container-low rounded-lg border border-surface-container-high p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Per-Invoice Risk Breakdown
        </h3>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["risk", "amount", "age"] as const).map((key) => (
            <button
              key={key}
              onClick={() => {
                if (sortKey === key) {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortKey(key);
                  setSortOrder("desc");
                }
              }}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortKey === key
                  ? "bg-primary text-on-primary"
                  : "bg-surface hover:bg-surface-container-high text-on-surface"
              }`}
            >
              Sort by {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
              {sortKey === key && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          ))}
        </div>

        {/* Invoice Risk Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-container-high text-on-surface-variant text-xs font-semibold uppercase">
                <th className="text-left py-3 px-3">Invoice ID</th>
                <th className="text-left py-3 px-3">Payer</th>
                <th className="text-left py-3 px-3">Amount</th>
                <th className="text-center py-3 px-3">Risk Score</th>
                <th className="text-center py-3 px-3">Risk Level</th>
                <th className="text-center py-3 px-3">Factors</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoiceRisks.map((risk) => {
                const isExpanded = expandedInvoices.has(risk.id.toString());
                return (
                  <React.Fragment key={risk.id.toString()}>
                    <tr className="border-b border-surface-container-high hover:bg-surface-container-high/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs">
                        #{risk.id.toString()}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {formatAddress(risk.freelancer)}
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold">
                        ${(Number(risk.amount) / 1e7).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold">
                          {risk.riskScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: RISK_COLORS[risk.riskLevel] + "20",
                            color: RISK_COLORS[risk.riskLevel],
                          }}
                        >
                          {risk.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            const newSet = new Set(expandedInvoices);
                            if (newSet.has(risk.id.toString())) {
                              newSet.delete(risk.id.toString());
                            } else {
                              newSet.add(risk.id.toString());
                            }
                            setExpandedInvoices(newSet);
                          }}
                          className="text-primary hover:underline text-xs font-semibold"
                        >
                          {isExpanded ? "Hide" : "Show"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Risk Factors */}
                    {isExpanded && (
                      <tr className="bg-surface-container-high/30 border-b border-surface-container-high">
                        <td colSpan={6} className="py-4 px-6">
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-surface rounded-lg p-3 border border-surface-container-high">
                              <div className="text-xs font-semibold text-on-surface-variant mb-1">
                                On-Time Payment Rate
                              </div>
                              <div className="text-lg font-bold mb-2">
                                {risk.riskFactors.onTimePaymentRate.toFixed(1)}%
                              </div>
                              <p className="text-xs text-on-surface-variant">
                                {RISK_FACTOR_EXPLANATIONS.onTimePaymentRate}
                              </p>
                            </div>

                            <div className="bg-surface rounded-lg p-3 border border-surface-container-high">
                              <div className="text-xs font-semibold text-on-surface-variant mb-1">
                                Default Count
                              </div>
                              <div className="text-lg font-bold mb-2">
                                {risk.riskFactors.defaultCount}
                              </div>
                              <p className="text-xs text-on-surface-variant">
                                {RISK_FACTOR_EXPLANATIONS.defaultCount}
                              </p>
                            </div>

                            <div className="bg-surface rounded-lg p-3 border border-surface-container-high">
                              <div className="text-xs font-semibold text-on-surface-variant mb-1">
                                Funding Age
                              </div>
                              <div className="text-lg font-bold mb-2">
                                {risk.riskFactors.fundingAge} days
                              </div>
                              <p className="text-xs text-on-surface-variant">
                                {RISK_FACTOR_EXPLANATIONS.fundingAge}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedInvoiceRisks.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No invoices to analyze yet.</p>
          </div>
        )}
      </div>

      {/* Risk Factor Explanations */}
      <div className="bg-surface-container-low rounded-lg border border-surface-container-high p-6">
        <h3 className="text-lg font-bold mb-4">Understanding Risk Factors</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(RISK_FACTOR_EXPLANATIONS).map(
            ([factor, explanation]) => (
              <div
                key={factor}
                className="bg-surface rounded-lg p-4 border border-surface-container-high"
              >
                <h4 className="font-semibold mb-2 capitalize">
                  {factor.replace(/([A-Z])/g, " $1").trim()}
                </h4>
                <p className="text-sm text-on-surface-variant">{explanation}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
