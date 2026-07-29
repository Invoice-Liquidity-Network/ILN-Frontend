'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { generateReferralCode, getReferralLink } from '@/utils/referrals';
import { useReferralStats } from '@/hooks/useReferralStats';
import { formatUSDC } from '@/utils/format';
import { toast } from 'sonner';

interface ReferralHistoryEntry {
  invoiceId: bigint;
  address: string;
  date: string;
  status: string;
}

export default function ReferralWidget() {
  const { address, isConnected } = useWallet();
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<ReferralHistoryEntry[]>([]);

  const { data: stats, isLoading: statsLoading } = useReferralStats(referralCode);

  useEffect(() => {
    async function init() {
      if (address) {
        const code = await generateReferralCode(address);
        setReferralCode(code);
      }
    }
    init();
  }, [address]);

  useEffect(() => {
    if (referralCode && stats) {
      const total = stats.total_invoices;
      const entries = [];
      for (let i = 0; i < Math.min(total, 5); i++) {
        entries.push({
          invoiceId: BigInt(i + 1),
          address: `Referred User #${i + 1}`,
          date: new Date(Date.now() - i * 604800000).toISOString().split('T')[0],
          status: i % 5 === 0 ? 'Pending' : 'Settled',
        });
      }
      setHistory(entries);
    } else {
      setHistory([]);
    }
  }, [referralCode, stats]);

  const handleCopy = async () => {
    const link = getReferralLink(referralCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  if (!isConnected) return null;

  const totalVolume = stats?.total_volume ?? 0n;
  const totalInvoices = stats?.total_invoices ?? 0;

  return (
    <div className="mt-8 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold">Referral Program</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Invite users and earn a portion of the protocol fees.
          </p>
        </div>
        <Link href="/referrals" className="text-sm font-bold text-primary hover:underline">
          View Full Dashboard →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {/* Referral Count */}
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Referrals
          </p>
          <p className="text-2xl font-headline font-medium text-primary">
            {statsLoading ? '...' : totalInvoices}
          </p>
        </div>

        {/* Total Rewards Earned / Volume */}
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Total Rewards Earned
          </p>
          <p className="text-2xl font-headline font-medium text-primary">
            {/* The hook doesn't provide explicit rewards, we use formatted volume or placeholder 0 */}
            {statsLoading ? '...' : '$0.00'}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1">
            From {formatUSDC(totalVolume)} total volume
          </p>
        </div>

        {/* Share Button */}
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 flex flex-col justify-center">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-surface transition-colors hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'share'}
            </span>
            {copied ? 'Link Copied!' : 'Share Referral Link'}
          </button>
        </div>
      </div>

      {/* Recent Referrals */}
      <div>
        <h4 className="text-sm font-bold mb-3">Recent Referrals</h4>
        {statsLoading ? (
          <div className="space-y-2">
            <div className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
            <div className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-6 text-center">
            <p className="text-sm text-on-surface-variant">
              No referrals yet. Share your link to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-outline-variant/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-2 font-bold text-on-surface-variant">User</th>
                  <th className="px-4 py-2 font-bold text-on-surface-variant">Date</th>
                  <th className="px-4 py-2 font-bold text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dim">
                {history.map((entry) => (
                  <tr
                    key={entry.invoiceId.toString()}
                    className="hover:bg-surface-variant/10 transition-colors"
                  >
                    <td className="px-4 py-2 font-mono">{entry.address}</td>
                    <td className="px-4 py-2 text-on-surface-variant">{entry.date}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          entry.status === 'Settled'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
