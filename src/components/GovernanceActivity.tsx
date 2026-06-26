"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchVotesForAddress, type VoteCastEvent } from "@/utils/governance";
import { formatDate } from "@/utils/format";
import Skeleton from "@/components/ui/Skeleton";

const PAGE_SIZE = 10;

interface GovernanceActivityProps {
  address: string;
}

export default function GovernanceActivity({ address }: GovernanceActivityProps) {
  const [votes, setVotes] = useState<VoteCastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadVotes() {
      setLoading(true);
      try {
        const data = await fetchVotesForAddress(address);
        setVotes(data);
      } catch (err) {
        console.error("Failed to fetch governance activity:", err);
      } finally {
        setLoading(false);
      }
    }
    loadVotes();
  }, [address]);

  const pageCount = Math.max(1, Math.ceil(votes.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => votes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [votes, page],
  );

  if (loading) {
    return (
      <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-on-surface">Governance Activity</h2>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-outline-variant/5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (votes.length === 0) {
    return (
      <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-on-surface">Governance Activity</h2>
        <p className="mt-6 text-center py-12 text-on-surface-variant bg-surface-container/30 rounded-2xl border border-dashed border-outline-variant/20">
          No governance activity yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-on-surface mb-6">Governance Activity</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10">
              <th className="pb-4 font-semibold">Proposal ID</th>
              <th className="pb-4 font-semibold">Action</th>
              <th className="pb-4 font-semibold text-center">Vote</th>
              <th className="pb-4 font-semibold text-right">Weight</th>
              <th className="pb-4 font-semibold text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {pageItems.map((vote) => (
              <tr key={`${vote.proposalId}-${vote.timestamp}`} className="group hover:bg-surface-container/20 transition-colors">
                <td className="py-4 font-mono text-sm">
                  <Link href={`/governance/${vote.proposalId}`} className="hover:text-primary transition-colors">
                    #{vote.proposalId}
                  </Link>
                </td>
                <td className="py-4">
                  <span className="text-sm font-medium text-on-surface line-clamp-1 max-w-[200px] sm:max-w-xs">
                    {vote.proposalTitle}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      vote.vote === "For"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : vote.vote === "Against"
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant/20"
                    }`}
                  >
                    {vote.vote}
                  </span>
                </td>
                <td className="py-4 text-right whitespace-nowrap">
                  <span className="text-sm font-mono text-on-surface">
                    {vote.weight.toLocaleString()} ILN
                  </span>
                </td>
                <td className="py-4 text-right whitespace-nowrap">
                  <span className="text-xs text-on-surface-variant">
                    {formatDate(BigInt(vote.timestamp))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-outline-variant/20 disabled:opacity-30 hover:bg-surface-container transition-colors"
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-xs font-semibold text-on-surface-variant">
            Page {page} of {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="p-2 rounded-lg border border-outline-variant/20 disabled:opacity-30 hover:bg-surface-container transition-colors"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      )}
    </section>
  );
}
