import type { Invoice } from "@/utils/soroban";

export interface DutchAuctionTerms {
  startRateBps: number;
  minRateBps: number;
  startedAt: number;
  endsAt: number;
}

export interface DutchAuctionState extends DutchAuctionTerms {
  currentRateBps: number;
  progressPercent: number;
  secondsUntilNextDecrease: number;
  isComplete: boolean;
}

function toNumber(value: bigint | number | string | undefined): number | null {
  if (value === undefined) return null;
  const numberValue = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function getDutchAuctionTerms(invoice: Invoice): DutchAuctionTerms | null {
  const isAuctionMode =
    invoice.auction_mode === true ||
    invoice.auctionMode === true ||
    invoice.mode === "auction" ||
    invoice.rate_mode === "auction";

  if (!isAuctionMode) return null;

  const startRateBps = toNumber(invoice.start_rate);
  const minRateBps = toNumber(invoice.min_rate);
  const startedAt = toNumber(invoice.auction_started_at);
  const endsAt = toNumber(invoice.auction_ends_at);

  if (
    startRateBps === null ||
    minRateBps === null ||
    startedAt === null ||
    endsAt === null ||
    endsAt <= startedAt ||
    startRateBps < minRateBps
  ) {
    return null;
  }

  return { startRateBps, minRateBps, startedAt, endsAt };
}

export function calculateDutchAuctionState(
  terms: DutchAuctionTerms,
  nowSeconds = Math.floor(Date.now() / 1000)
): DutchAuctionState {
  const totalDuration = terms.endsAt - terms.startedAt;
  const elapsed = Math.min(Math.max(nowSeconds - terms.startedAt, 0), totalDuration);
  const rateDelta = terms.startRateBps - terms.minRateBps;
  const progress = totalDuration === 0 ? 1 : elapsed / totalDuration;
  const currentRateBps = Math.max(
    terms.minRateBps,
    Math.round(terms.startRateBps - rateDelta * progress)
  );
  const secondsPerBps = rateDelta > 0 ? totalDuration / rateDelta : totalDuration;
  const elapsedSinceLastDecrease = rateDelta > 0 ? elapsed % secondsPerBps : 0;
  const secondsUntilNextDecrease =
    currentRateBps <= terms.minRateBps
      ? 0
      : Math.max(1, Math.ceil(secondsPerBps - elapsedSinceLastDecrease));

  return {
    ...terms,
    currentRateBps,
    progressPercent: Math.min(100, Math.max(0, progress * 100)),
    secondsUntilNextDecrease,
    isComplete: nowSeconds >= terms.endsAt || currentRateBps <= terms.minRateBps,
  };
}

export function formatAuctionCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
