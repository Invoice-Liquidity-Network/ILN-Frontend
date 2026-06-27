'use client';

import { useMemo, useState, useEffect } from 'react';
import { exportToCSV } from '@/utils/exportData';
import { formatAddress, formatDate, formatTokenAmount, calculateYield } from '@/utils/format';
import type { Invoice } from '@/utils/soroban';
import FieldTooltip from './FieldTooltip';
import type { ApprovedToken } from '@/hooks/useApprovedTokens';
import { fetchProtocolParameters } from '@/utils/governance';
import useMediaQuery, { MOBILE_QUERY } from '@/hooks/useMediaQuery';
import ProgressiveDisclosureCards, { DisclosureColumn } from './ProgressiveDisclosureCards';

const PAGE_SIZE = 20;

interface LPEarningsHistoryProps {
  invoices: Invoice[];
  tokenMap: Map<string, ApprovedToken>;
  defaultToken?: ApprovedToken | null;
  walletAddress?: string | null;
}

export default function LPEarningsHistory({
  invoices,
  tokenMap,
  defaultToken = null,
  walletAddress,
}: LPEarningsHistoryProps) {
  const paidInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === 'Paid' && invoice.funder === walletAddress)
        .filter((invoice) => invoice.funded_at !== undefined && invoice.funded_at !== null),
    [invoices, walletAddress]
  );

  const sortedInvoices = useMemo(
    () => [...paidInvoices].sort((a, b) => Number(b.funded_at ?? 0n) - Number(a.funded_at ?? 0n)),
    [paidInvoices]
  );

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(sortedInvoices.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleInvoices = sortedInvoices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const [protocolFeeBps, setProtocolFeeBps] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchProtocolParameters()
      .then((p) => {
        if (!mounted) return;
        setProtocolFeeBps(p.feeRateBps ?? 0);
      })
      .catch(() => setProtocolFeeBps(0));
    return () => {
      mounted = false;
    };
  }, []);

  const isMobile = useMediaQuery(MOBILE_QUERY);

  const getToken = (invoice: Invoice) =>
    tokenMap.get(invoice.token ?? defaultToken?.contractId ?? '') ?? defaultToken;

  // Column config reused by the mobile progressive-disclosure cards.
  const mobileColumns: DisclosureColumn<Invoice>[] = [
    {
      id: 'id',
      label: 'Invoice ID',
      renderCell: (inv) => <span className="font-bold text-primary">#{inv.id.toString()}</span>,
    },
    {
      id: 'amount',
      label: 'Amount Funded',
      renderCell: (inv) =>
        formatTokenAmount(inv.amount, getToken(inv) ?? { symbol: 'USDC', decimals: 6 }),
    },
    {
      id: 'earned',
      label: 'Earned',
      renderCell: (inv) => (
        <span className="text-green-600">
          {formatTokenAmount(
            calculateYield(inv.amount, inv.discount_rate),
            getToken(inv) ?? { symbol: 'USDC', decimals: 6 }
          )}
        </span>
      ),
    },
    { id: 'payer', label: 'Payer', renderCell: (inv) => formatAddress(inv.payer) },
    {
      id: 'settlement',
      label: 'Settlement Date',
      renderCell: (inv) => (inv.funded_at ? formatDate(inv.funded_at) : 'N/A'),
    },
    {
      id: 'payout',
      label: 'Payout Received',
      renderCell: (inv) =>
        formatTokenAmount(
          inv.amount + calculateYield(inv.amount, inv.discount_rate),
          getToken(inv) ?? { symbol: 'USDC', decimals: 6 }
        ),
    },
    {
      id: 'fee',
      label: 'Fee Paid',
      renderCell: (inv) => {
        const yieldAmount = calculateYield(inv.amount, inv.discount_rate);
        const feePaid = protocolFeeBps ? (yieldAmount * BigInt(protocolFeeBps)) / 10000n : 0n;
        return formatTokenAmount(feePaid, getToken(inv) ?? { symbol: 'USDC', decimals: 6 });
      },
    },
    { id: 'token', label: 'Token', renderCell: (inv) => getToken(inv)?.symbol ?? 'USDC' },
    {
      id: 'yield',
      label: 'Yield %',
      renderCell: (inv) => `${(inv.discount_rate / 100).toFixed(2)}%`,
    },
  ];

  const exportData = sortedInvoices.map((invoice) => {
    const token = getToken(invoice);
    const yieldAmount = calculateYield(invoice.amount, invoice.discount_rate);
    const payoutReceived = invoice.amount + yieldAmount;
    const amountFunded = formatTokenAmount(
      invoice.amount,
      token ?? { symbol: 'USDC', decimals: 6 }
    );
    const payout = formatTokenAmount(payoutReceived, token ?? { symbol: 'USDC', decimals: 6 });
    const earned = formatTokenAmount(yieldAmount, token ?? { symbol: 'USDC', decimals: 6 });
    const feePaid = protocolFeeBps
      ? formatTokenAmount(
          (yieldAmount * BigInt(protocolFeeBps)) / 10000n,
          token ?? { symbol: 'USDC', decimals: 6 }
        )
      : '0';

    return {
      'Invoice ID': `#${invoice.id.toString()}`,
      Payer: formatAddress(invoice.payer),
      'Settlement Date': invoice.funded_at ? formatDate(invoice.funded_at) : 'N/A',
      'Amount Funded': amountFunded,
      'Payout Received': payout,
      Earned: earned,
      'Fee Paid': feePaid,
      Token: token?.symbol ?? 'USDC',
      'Yield %': `${(invoice.discount_rate / 100).toFixed(2)}%`,
    };
  });

  const handleExport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `ILN-LP-Earnings-${dateStr}.csv`);
  };

  if (!walletAddress) {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 text-center text-on-surface-variant">
        Connect your wallet to view earnings history.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold">Earnings History</h3>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-on-surface-variant">
              View all settled invoices you funded, sorted by settlement date.
            </p>
            {protocolFeeBps === 0 && (
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider">
                0% Fee
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-surface-container-lowest shadow-sm transition-colors hover:bg-primary/90"
        >
          Export CSV
        </button>
      </div>

      {sortedInvoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface flex min-h-[220px] items-center justify-center p-8 text-center text-sm text-on-surface-variant">
          No settled earnings history is available yet.
        </div>
      ) : isMobile ? (
        <ProgressiveDisclosureCards
          data={visibleInvoices}
          columns={mobileColumns}
          keyExtractor={(inv) => inv.id.toString()}
          keyColumnIds={['id', 'amount', 'earned']}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-dim bg-surface-container-lowest">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Invoice ID
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Payer
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Settlement Date
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Amount Funded
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Payout Received
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Earned
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    Fee Paid
                    <FieldTooltip
                      content="This fee funds ILN protocol development and the treasury"
                      trigger={
                        <span className="material-symbols-outlined text-[14px] cursor-help normal-case">
                          info
                        </span>
                      }
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Token
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Yield %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dim">
              {visibleInvoices.map((invoice) => {
                const token = getToken(invoice);
                const yieldAmount = calculateYield(invoice.amount, invoice.discount_rate);
                const payoutReceived = invoice.amount + yieldAmount;
                const feePaid = protocolFeeBps
                  ? (yieldAmount * BigInt(protocolFeeBps)) / 10000n
                  : 0n;

                return (
                  <tr key={invoice.id.toString()} className="hover:bg-surface-variant/50">
                    <td className="px-4 py-4 font-bold text-primary">#{invoice.id.toString()}</td>
                    <td className="px-4 py-4 text-sm text-on-surface">
                      {formatAddress(invoice.payer)}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">
                      {invoice.funded_at ? formatDate(invoice.funded_at) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {formatTokenAmount(invoice.amount, token ?? { symbol: 'USDC', decimals: 6 })}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {formatTokenAmount(payoutReceived, token ?? { symbol: 'USDC', decimals: 6 })}
                    </td>
                    <td className="px-4 py-4 font-medium text-green-600">
                      {formatTokenAmount(yieldAmount, token ?? { symbol: 'USDC', decimals: 6 })}
                    </td>
                    <td className="px-4 py-4 font-medium text-on-surface">
                      {formatTokenAmount(feePaid, token ?? { symbol: 'USDC', decimals: 6 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface">{token?.symbol ?? 'USDC'}</td>
                    <td className="px-4 py-4 text-sm text-on-surface">
                      {(invoice.discount_rate / 100).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sortedInvoices.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-on-surface-variant">
          <p>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, sortedInvoices.length)} of {sortedInvoices.length}{' '}
            records
          </p>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-outline-variant/20 px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-medium">
              Page {currentPage} of {pageCount}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              disabled={currentPage === pageCount}
              className="rounded-lg border border-outline-variant/20 px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
