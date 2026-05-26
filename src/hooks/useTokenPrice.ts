"use client";

import { useEffect, useState } from "react";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";

const COINGECKO_IDS_BY_SYMBOL: Record<string, string> = {
  EURC: "eurc",
  USDC: "usd-coin",
  XLM: "stellar",
};

const PRICE_CACHE_TTL_MS = 60_000;

interface PriceCacheEntry {
  fetchedAt: number;
  priceUsd: number;
}

const priceCache = new Map<string, PriceCacheEntry>();

export function useTokenPrice(token: Pick<ApprovedToken, "symbol"> | null | undefined) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const symbol = token?.symbol?.toUpperCase() ?? "";
  const coinId = COINGECKO_IDS_BY_SYMBOL[symbol];

  useEffect(() => {
    let cancelled = false;

    async function loadPrice() {
      if (!coinId) {
        setPriceUsd(null);
        setIsLoading(false);
        return;
      }

      const cached = priceCache.get(coinId);
      if (cached && Date.now() - cached.fetchedAt < PRICE_CACHE_TTL_MS) {
        setPriceUsd(cached.priceUsd);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
            coinId,
          )}&vs_currencies=usd`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch token price.");
        }

        const data = (await response.json()) as Record<string, { usd?: unknown }>;
        const nextPrice = data[coinId]?.usd;

        if (typeof nextPrice !== "number" || !Number.isFinite(nextPrice) || nextPrice <= 0) {
          throw new Error("Token price response was missing a valid USD price.");
        }

        priceCache.set(coinId, { fetchedAt: Date.now(), priceUsd: nextPrice });

        if (!cancelled) {
          setPriceUsd(nextPrice);
        }
      } catch {
        if (!cancelled) {
          setPriceUsd(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPrice();

    return () => {
      cancelled = true;
    };
  }, [coinId]);

  return { priceUsd, isLoading };
}

export function clearTokenPriceCacheForTests() {
  priceCache.clear();
}
