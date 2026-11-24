'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRecentProtocolFeed } from '@/hooks/useRecentProtocolFeed';
import DataSourceCaption from '@/components/DataSourceCaption';
import type { ProtocolFeedItem } from '@/utils/protocol-feed';

/**
 * Enforce confirmed-only invariant for the protocol activity feed (#1283).
 *
 * Separates wallet-submitted (local pending store), indexer-known (lagging
 * off-chain cache), and RPC-confirmed (Horizon/Stellar RPC settled) entries:
 * only `rpc_confirmed` (or untagged RPC-sourced) items may render here.
 */
export function filterConfirmedFeedItems(items: ProtocolFeedItem[]): ProtocolFeedItem[] {
  return items.filter(
    (item) =>
      item.confirmationStatus === undefined || item.confirmationStatus === 'rpc_confirmed'
  );
}

function FeedRow({ item, isNew }: { item: ProtocolFeedItem; isNew: boolean }) {
  return (
    <li
      data-feed-id={item.id}
      data-testid="recent-transaction-item"
      data-confirmation-status="rpc-confirmed"
      data-animate-new={isNew ? 'true' : 'false'}
      className={`flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3 ${
        isNew ? 'animate-in slide-in-from-top-4 duration-300' : ''
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {item.icon}
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-on-surface">{item.label}</p>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            RPC confirmed
          </span>
        </div>
        <p className="text-xs text-on-surface-variant">
          <span className="font-semibold text-on-surface">{item.amount}</span> {item.token}
          <span className="mx-1.5 text-outline-variant">·</span>
          <time
            dateTime={item.timestampMs > 0 ? new Date(item.timestampMs).toISOString() : undefined}
          >
            {item.dateLabel}
          </time>
        </p>
      </div>

      <Link
        href={`/i/${item.invoiceId}`}
        className="shrink-0 text-xs font-bold text-primary hover:underline"
      >
        Invoice #{item.invoiceId}
      </Link>
    </li>
  );
}

/**
 * Confirmed-only recent protocol transactions panel (#1283).
 *
 * Data source & status separation:
 * - Displays only RPC-confirmed protocol contract events (`useRecentProtocolFeed`).
 * - Intentionally excludes wallet-submitted pending transactions and
 *   indexer-known events so unconfirmed local submissions never masquerade as
 *   settled network activity.
 * - On RPC failure, renders an honest unavailable message with
 *   `provenance="unavailable"`.
 */
export default function RecentTransactionsPanel() {
  const { data: rawItems = [], isLoading, isError } = useRecentProtocolFeed();
  const items = useMemo(() => filterConfirmedFeedItems(rawItems), [rawItems]);
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (items.length === 0) return;

    const currentIds = new Set(items.map((item) => item.id));
    const added = new Set<string>();

    if (seenIdsRef.current.size > 0) {
      for (const id of currentIds) {
        if (!seenIdsRef.current.has(id)) {
          added.add(id);
        }
      }
    }

    seenIdsRef.current = currentIds;

    if (added.size === 0) return;

    setNewIds(added);
    const timer = window.setTimeout(() => setNewIds(new Set()), 400);
    return () => window.clearTimeout(timer);
  }, [items]);

  return (
    <section
      className="bg-surface-container py-12 px-4 sm:px-8"
      aria-labelledby="recent-transactions-heading"
      data-testid="recent-transactions-panel"
    >
      <div className="mx-auto max-w-7xl">
        <h2
          id="recent-transactions-heading"
          className="font-headline text-2xl font-bold text-on-surface"
        >
          Recent Protocol Activity
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Live invoice submissions, fundings, settlements, and disputes on the network.
        </p>
        <DataSourceCaption
          metric="recent-protocol-activity"
          provenance={isError ? 'unavailable' : 'rpc'}
          className="mt-2"
        />

        {isLoading ? (
          <ul className="mt-6 flex flex-col gap-3" aria-label="Loading recent transactions">
            {Array.from({ length: 4 }).map((_, index) => (
              <li
                key={index}
                className="h-16 animate-pulse rounded-2xl border border-outline-variant/10 bg-surface-container-low"
              />
            ))}
          </ul>
        ) : isError ? (
          <p className="mt-6 text-sm text-on-surface-variant">
            Unable to load recent activity right now.
          </p>
        ) : items.length === 0 ? (
          <p className="mt-6 text-sm text-on-surface-variant">No recent transactions yet.</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3" aria-live="polite">
            {items.map((item) => (
              <FeedRow key={item.id} item={item} isNew={newIds.has(item.id)} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
