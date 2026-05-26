"use client";

import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import type { WalletRole } from "@/utils/walletRoles";

const ROLE_CONFIG: Record<WalletRole, {
  title: string;
  description: string;
  href: string;
  icon: string;
}> = {
  freelancer: {
    title: "Freelancer dashboard",
    description: "Review submitted invoices and cancellation actions.",
    href: "/dashboard",
    icon: "request_quote",
  },
  payer: {
    title: "Payer settlement",
    description: "Settle funded invoices assigned to your wallet.",
    href: "/payer",
    icon: "payments",
  },
  lp: {
    title: "LP portfolio",
    description: "Track funded positions and browse invoice opportunities.",
    href: "/lp",
    icon: "account_balance",
  },
};

export default function RoleDashboardHighlights() {
  const { address, roles, rolesLoading, roleSummary } = useWallet();

  if (!address) return null;

  const visibleRoles: WalletRole[] = roles.length > 0 ? roles : ["freelancer", "payer", "lp"];

  return (
    <section className="border-y border-outline-variant/10 bg-surface-container-low px-8 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Connected wallet
            </p>
            <h2 className="mt-1 text-2xl font-headline">Your ILN workspace</h2>
          </div>
          <p className="text-sm text-on-surface-variant">
            {rolesLoading
              ? "Detecting invoice roles..."
              : roles.length > 0
                ? `${roleSummary.submittedCount} submitted / ${roleSummary.payerCount} payable / ${roleSummary.fundedCount} funded`
                : "No on-chain role history found yet"}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {visibleRoles.map((role) => {
            const config = ROLE_CONFIG[role];
            const active = roles.includes(role);

            return (
              <Link
                key={role}
                href={config.href}
                className={`rounded-lg border p-4 transition-colors ${
                  active
                    ? "border-primary/30 bg-primary-container/30"
                    : "border-outline-variant/15 bg-surface-container-lowest/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-2xl ${active ? "text-primary" : "text-on-surface-variant"}`}>
                    {config.icon}
                  </span>
                  <div>
                    <p className="font-bold text-on-surface">{config.title}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{config.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

