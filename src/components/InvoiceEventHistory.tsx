"use client";

import ActivityFeed from "@/components/ActivityFeed";

export default function InvoiceEventHistory({ invoiceId }: { invoiceId: bigint }) {
  return (
    <section className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Event history</p>
        <h2 className="mt-2 text-xl font-headline">Contract activity</h2>
      </div>
      <ActivityFeed invoiceId={invoiceId} />
    </section>
  );
}
