"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { formatAddress, formatUSDC } from "@/utils/format";
import { getTopPayers, TopPayer } from "@/utils/soroban";
import { resolveFederatedAddress } from "@/utils/federation";
import { NETWORK_NAME } from "@/constants";

const DEFAULT_LEADERBOARD_LIMIT = 50;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function getStellarExpertProfileUrl(address: string) {
  const networkPath = NETWORK_NAME.toUpperCase() === "TESTNET" ? "testnet" : "public";
  return `https://stellar.expert/explorer/${networkPath}/account/${address}`;
}

function getDisplayAddress(name: string, address: string) {
  return name && name !== address ? name : formatAddress(address);
}

export default function LeaderboardPage() {
  const { address: connectedAddress } = useWallet();
  const [leaderboard, setLeaderboard] = useState<TopPayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [federatedNames, setFederatedNames] = useState<Record<string, string>>({});
  const currentUrl = useRef<string>("");

  const highlightAddress = useMemo(
    () => connectedAddress?.toLowerCase() ?? "",
    [connectedAddress]
  );

  const isUserRow = (address: string) =>
    connectedAddress !== null && address.toLowerCase() === highlightAddress;

  useEffect(() => {
    if (typeof window !== "undefined") {
      currentUrl.current = window.location.href;
    }
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const topPayers = await getTopPayers(DEFAULT_LEADERBOARD_LIMIT);
      setLeaderboard(topPayers);
    } catch (err) {
      setError("Unable to load leaderboard data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    const intervalId = window.setInterval(loadLeaderboard, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;
    const uniqueAddresses = Array.from(new Set(leaderboard.map((entry) => entry.address)));

    const resolveFederationNames = async () => {
      const resolved: Record<string, string> = {};
      await Promise.all(
        uniqueAddresses.map(async (address) => {
          if (federatedNames[address]) return;
          const name = await resolveFederatedAddress(address);
          if (!active) return;
          if (name && name !== address) {
            resolved[address] = name;
          }
        })
      );
      if (active && Object.keys(resolved).length > 0) {
        setFederatedNames((current) => ({ ...current, ...resolved }));
      }
    };

    if (uniqueAddresses.length > 0) {
      void resolveFederationNames();
    }

    return () => {
      active = false;
    };
  }, [leaderboard, federatedNames]);

  const handleShare = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(currentUrl.current || "/leaderboard");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-on-surface-variant mb-2">Leaderboard</p>
          <h1 className="text-3xl font-semibold">Top Payers Reputation Board</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Find the most reliable payers by reputation, invoices paid, defaults and settled volume.
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center rounded-2xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
        >
          {copied ? "Link copied" : "Share Leaderboard"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-1">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-surface dark:bg-surface-container-highest text-on-surface-variant text-xs uppercase tracking-[0.16em]">
              <th className="px-5 py-4">Rank</th>
              <th className="px-5 py-4">Address</th>
              <th className="px-5 py-4">Score</th>
              <th className="px-5 py-4">Invoices Paid</th>
              <th className="px-5 py-4">Invoices Defaulted</th>
              <th className="px-5 py-4">Total Volume</th>
              <th className="px-5 py-4">Profile</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant">
                  Loading leaderboard…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-error">
                  {error}
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant">
                  No payers found.
                </td>
              </tr>
            ) : (
              leaderboard.map((row, index) => {
                const isUser = isUserRow(row.address);
                const displayName = getDisplayAddress(federatedNames[row.address] ?? "", row.address);

                return (
                  <tr
                    key={row.address}
                    data-testid={isUser ? "leaderboard-user-row" : undefined}
                    className={`border-t border-outline-variant/20 ${isUser ? "bg-primary/10" : "bg-transparent"}`}
                  >
                    <td className="px-5 py-4 font-semibold text-on-surface-variant">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{displayName}</span>
                        <span className="text-xs text-on-surface-variant/80">{formatAddress(row.address)}</span>
                        {isUser ? <span className="text-[11px] font-semibold uppercase text-primary">Your wallet</span> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold">{row.score.toLocaleString()}</td>
                    <td className="px-5 py-4">{row.invoices_paid.toLocaleString()}</td>
                    <td className="px-5 py-4">{row.invoices_defaulted.toLocaleString()}</td>
                    <td className="px-5 py-4">{formatUSDC(row.total_volume)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/profile/${row.address}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          View Profile
                        </Link>
                        <a
                          href={getStellarExpertProfileUrl(row.address)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-on-surface-variant hover:underline"
                        >
                          Stellar Expert
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
