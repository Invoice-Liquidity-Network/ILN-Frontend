'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/context/WalletContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isAdminAddress } from '@/utils/admin-health';
import { env } from '@/lib/env';

interface FlagEntry {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
}

function getFlags(): FlagEntry[] {
  return [
    {
      name: 'NEXT_PUBLIC_INSURANCE_POOL_ENABLED',
      label: 'Insurance Pool',
      description: 'Liquidity insurance pooling panel on the LP dashboard.',
      enabled: env.NEXT_PUBLIC_INSURANCE_POOL_ENABLED,
    },
    {
      name: 'NEXT_PUBLIC_ORACLE_ENABLED',
      label: 'Oracle Badge',
      description: 'Oracle verification badge component in the UI.',
      enabled: env.NEXT_PUBLIC_ORACLE_ENABLED,
    },
    {
      name: 'NEXT_PUBLIC_NFT_ENABLED',
      label: 'Invoice NFT',
      description: 'Soroban Invoice NFT metadata card on invoice detail pages.',
      enabled: env.NEXT_PUBLIC_NFT_ENABLED,
    },
  ];
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      data-testid={enabled ? 'flag-enabled' : 'flag-disabled'}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest',
        enabled
          ? 'bg-green-500/15 text-green-700 dark:text-green-400'
          : 'bg-surface-variant text-on-surface-variant',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          enabled ? 'bg-green-500' : 'bg-on-surface-variant/40',
        ].join(' ')}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  );
}

function FlagRow({ flag }: { flag: FlagEntry }) {
  return (
    <li
      data-testid="flag-row"
      className="flex flex-col gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-on-surface">{flag.label}</p>
        <p className="text-sm text-on-surface-variant">{flag.description}</p>
        <code className="mt-1 text-xs text-on-surface-variant/60">{flag.name}</code>
      </div>
      <StatusBadge enabled={flag.enabled} />
    </li>
  );
}

export default function AdminFlagDashboard() {
  const { address } = useWallet();
  const router = useRouter();
  const [flags] = useState<FlagEntry[]>(getFlags);

  useDocumentTitle('Feature Flag Status · Admin');

  useEffect(() => {
    if (address !== undefined && !isAdminAddress(address)) {
      router.replace('/admin');
    }
  }, [address, router]);

  const isAdmin = isAdminAddress(address);

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen flex-col">
        <Navbar />
        <section className="mx-auto mt-24 w-full max-w-2xl px-4 text-center">
          <p className="text-lg font-semibold text-on-surface">Access Restricted</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            This page is only visible to the protocol admin.
          </p>
        </section>
      </main>
    );
  }

  const enabledCount = flags.filter((f) => f.enabled).length;

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />

      <section className="mx-auto mt-10 w-full max-w-3xl px-4 pb-24">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            Admin · Internal
          </p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface">Feature Flag Status</h1>
          <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
            Read-only view of the current feature flag state for this environment. Flags are
            controlled via Vercel environment variables — changes require a redeployment.
          </p>
        </header>

        <div className="mb-6 flex gap-4">
          <div className="flex-1 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
              Total flags
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">{flags.length}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">
              Enabled
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">{enabledCount}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
              Disabled
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {flags.length - enabledCount}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3" data-testid="flag-list">
          {flags.map((flag) => (
            <FlagRow key={flag.name} flag={flag} />
          ))}
        </ul>

        <p className="mt-8 text-xs text-on-surface-variant/60">
          Flag values are read from{' '}
          <code className="font-mono">NEXT_PUBLIC_*_ENABLED</code> environment variables at build
          time. To change a flag, update the variable in Vercel and trigger a redeployment. See{' '}
          <a href="/docs/feature-flags.md" className="underline">
            docs/feature-flags.md
          </a>{' '}
          for the flag lifecycle policy.
        </p>
      </section>
    </main>
  );
}
