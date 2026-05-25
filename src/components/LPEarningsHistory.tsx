"use client";

import { useMemo, useState } from "react";
import { formatAddress, formatDate, formatUSDC, calculateYield } from "@/utils/format";
import type { Invoice } from "@/utils/soroban";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import DataTable, { DataTableColumn } from "./DataTable";
import { exportToCSV } from "@/utils/exportData";
import { Download } from "lucide-react";

interface LPEarningsHistoryProps {
  invoices: Invoice[];
  isLoading: boolean;
  tokenMap?: Map<string, ApprovedToken>;
  defaultToken?: ApprovedToken | null;
  address: string | null;
}

export default function LPEarningsHistory({
  invoices,
  isLoading,
  tokenMap = new Map(),
  defaultToken = null,
  address,
}: LPEarningsHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const historyInvoices = useMemo(() => {
    if (!address) return [];

    const paidInvoices = invoices.filter(
      (inv) => inv.status === "Paid" && inv.funder === address
    );

    return paidInvoices.sort((a, b) => {
      const dateA = a.funded_at ?? a.due_date;
      const dateB = b.funded_at ?? b.due_date;
      return Number(dateB) - Number(dateA);
    });
  }, [invoices, address]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return historyInvoices.slice(startIndex, startIndex + pageSize);
  }, [historyInvoices, currentPage]);

  const columns: DataTableColumn<Invoice>[] = [
    {
      id: "id",
      label: "Invoice ID",
      isMandatory: true,
      sortable: true,
      renderCell: (inv) => <span className="font-bold text-primary">#{inv.id.toString()}</span>,
    },
    {
      id: "payer",
      label: "Payer",
      sortable: false,
      renderCell: (inv) => <span>{formatAddress(inv.payer)}</span>,
    },
    {
      id: "settlement_date",
      label: "Settlement Date",
      sortable: true,
      renderCell: (inv) => <span>{formatDate(inv.funded_at ?? inv.due_date)}</span>,
    },
    {
      id: "amount_funded",
      label: "Amount Funded",
      sortable: true,
      renderCell: (inv) => <span className="font-bold">{formatUSDC(inv.amount)}</span>,
    },
    {
      id: "payout_received",
      label: "Payout Received",
      sortable: false,
      renderCell: (inv) => {
        const yieldAmount = calculateYield(inv.amount, inv.discount_rate);
        const payout = inv.amount + yieldAmount;
        return <span className="font-bold text-green-600">{formatUSDC(payout)}</span>;
      },
    },
    {
      id: "earned",
      label: "Earned",
      sortable: false,
      renderCell: (inv) => {
        const yieldAmount = calculateYield(inv.amount, inv.discount_rate);
        return <span className="font-bold text-green-600">+{formatUSDC(yieldAmount)}</span>;
      },
    },
    {
      id: "token",
      label: "Token",
      sortable: false,
      renderCell: (inv) => {
        const token = tokenMap.get(inv.token ?? defaultToken?.contractId ?? "") ?? defaultToken;
        return <span>{token?.symbol ?? "USDC"}</span>;
      },
    },
    {
      id: "yield",
      label: "Yield %",
      sortable: true,
      renderCell: (inv) => <span>{(inv.discount_rate / 100).toFixed(2)}%</span>,
    },
  ];

  const handleExportCSV = () => {
    const csvData = historyInvoices.map((inv) => {
      const yieldAmount = calculateYield(inv.amount, inv.discount_rate);
      const payout = inv.amount + yieldAmount;
      const token = tokenMap.get(inv.token ?? defaultToken?.contractId ?? "") ?? defaultToken;

      return {
        "Invoice ID": inv.id.toString(),
        "Payer": inv.payer,
        "Settlement Date": formatDate(inv.funded_at ?? inv.due_date),
        "Amount Funded": (Number(inv.amount) / 10000000).toString(),
        "Payout Received": (Number(payout) / 10000000).toString(),
        "Earned (diff)": (Number(yieldAmount) / 10000000).toString(),
        "Token": token?.symbol ?? "USDC",
        "Yield %": (inv.discount_rate / 100).toFixed(2),
      };
    });

    const dateStr = new Date().toISOString().split("T")[0];
    exportToCSV(csvData, `ILN-LP-Earnings-${dateStr}.csv`);
  };

  return (
    <div className="space-y-6 bg-surface-container-low rounded-xl p-6">
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md transition-colors"
          disabled={historyInvoices.length === 0}
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <DataTable
        data={paginatedInvoices}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(inv) => inv.id.toString()}
        emptyMessage="No Earnings History found."
        pagination={{
          currentPage,
          pageSize,
          totalItems: historyInvoices.length,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
}
