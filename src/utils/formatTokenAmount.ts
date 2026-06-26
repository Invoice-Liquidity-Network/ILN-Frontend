export interface TokenConfig {
  symbol: string;
  decimals: number;
}

function groupInteger(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatTokenAmount(
  amount: bigint,
  token: TokenConfig = { symbol: "USDC", decimals: 6 },
): string {
  const decimals = Math.max(0, token.decimals);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const divisor = 10n ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = absolute % divisor;
  const wholePart = groupInteger(whole.toString());

  if (decimals === 0 || fraction === 0n) {
    return `${negative ? "-" : ""}${wholePart} ${token.symbol}`;
  }

  const rawFraction = fraction.toString().padStart(decimals, "0");
  const fractionPart = whole === 0n ? rawFraction : rawFraction.replace(/0+$/, "");

  return `${negative ? "-" : ""}${wholePart}.${fractionPart} ${token.symbol}`;
}

export function tokenAmountToNumber(
  amount: bigint,
  token: Pick<TokenConfig, "decimals"> = { decimals: 6 },
): number {
  return Number(amount) / 10 ** token.decimals;
}
