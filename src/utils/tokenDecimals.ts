/**
 * Token Decimal & Unit Reconciliation Utility (#1139)
 *
 * Reconciles raw on-chain transaction units (atomic integer/stroops) with
 * human-readable decimal representations across analytics charts and governance views.
 *
 * Prevents orders-of-magnitude display errors between 7-decimal Stellar native assets (XLM, USDC)
 * and 6-decimal EVM-bridged tokens.
 */

export interface CanonicalTokenConfig {
  symbol: string;
  decimals: number;
  displayName: string;
}

export const CANONICAL_TOKEN_REGISTRY: Record<string, CanonicalTokenConfig> = {
  XLM: { symbol: 'XLM', decimals: 7, displayName: 'Stellar Lumens' },
  USDC: { symbol: 'USDC', decimals: 7, displayName: 'USD Coin (Stellar)' },
  EURC: { symbol: 'EURC', decimals: 7, displayName: 'Euro Coin (Stellar)' },
  BTC: { symbol: 'BTC', decimals: 8, displayName: 'Bitcoin' },
  ETH: { symbol: 'ETH', decimals: 7, displayName: 'Ethereum' },
};

export const DEFAULT_FALLBACK_DECIMALS = 7;

/**
 * Resolve canonical decimals for a given token symbol.
 */
export function resolveTokenDecimals(symbol?: string): number {
  if (!symbol) return DEFAULT_FALLBACK_DECIMALS;
  const upper = symbol.toUpperCase().trim();
  return CANONICAL_TOKEN_REGISTRY[upper]?.decimals ?? DEFAULT_FALLBACK_DECIMALS;
}

export interface ReconciledUnit {
  /** Floating point value suitable for Recharts axes and calculation */
  normalized: number;
  /** High-precision string without scientific notation */
  decimalString: string;
  /** Formatted user-facing display with symbol */
  formattedWithSymbol: string;
  symbol: string;
  decimals: number;
}

/**
 * Reconciles a raw transaction amount (BigInt, string, or number) into normalized chart values.
 */
export function reconcileTokenUnits(
  rawAmount: bigint | number | string,
  symbol: string = 'USDC',
  customDecimals?: number,
): ReconciledUnit {
  const decimals = customDecimals ?? resolveTokenDecimals(symbol);
  const normalizedSymbol = symbol.toUpperCase().trim();

  let bigIntAmount: bigint;
  if (typeof rawAmount === 'bigint') {
    bigIntAmount = rawAmount;
  } else if (typeof rawAmount === 'number') {
    if (!Number.isFinite(rawAmount)) {
      return {
        normalized: 0,
        decimalString: '0',
        formattedWithSymbol: `0 ${normalizedSymbol}`,
        symbol: normalizedSymbol,
        decimals,
      };
    }
    bigIntAmount = BigInt(Math.trunc(rawAmount));
  } else {
    try {
      bigIntAmount = BigInt(rawAmount.trim() || '0');
    } catch {
      bigIntAmount = 0n;
    }
  }

  const isNegative = bigIntAmount < 0n;
  const absAmount = isNegative ? -bigIntAmount : bigIntAmount;
  const divisor = 10n ** BigInt(decimals);

  const integerPart = absAmount / divisor;
  const remainder = absAmount % divisor;

  const rawFraction = remainder.toString().padStart(decimals, '0');
  const trimmedFraction = rawFraction.replace(/0+$/, '');

  const decimalString =
    trimmedFraction.length > 0
      ? `${isNegative ? '-' : ''}${integerPart.toString()}.${trimmedFraction}`
      : `${isNegative ? '-' : ''}${integerPart.toString()}`;

  const normalized = Number(decimalString);

  // Group integer part for friendly UI presentation
  const groupedInteger = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedWithSymbol =
    trimmedFraction.length > 0
      ? `${isNegative ? '-' : ''}${groupedInteger}.${trimmedFraction.slice(0, 4)} ${normalizedSymbol}`
      : `${isNegative ? '-' : ''}${groupedInteger} ${normalizedSymbol}`;

  return {
    normalized,
    decimalString,
    formattedWithSymbol,
    symbol: normalizedSymbol,
    decimals,
  };
}
