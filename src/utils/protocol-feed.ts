import type { ContractEventType, ParsedContractEvent } from "@/lib/contract-events";
import type { Invoice } from "@/utils/soroban";
import { TESTNET_USDC_TOKEN_ID, TESTNET_EURC_TOKEN_ID, TESTNET_XLM_TOKEN_ID } from "@/constants";

export const PROTOCOL_FEED_EVENT_TYPES = [
  "InvoiceSubmitted",
  "InvoiceFunded",
  "InvoicePaid",
  "InvoiceDisputed",
] as const;

export type ProtocolFeedEventType = (typeof PROTOCOL_FEED_EVENT_TYPES)[number];

export interface ProtocolFeedItem {
  id: string;
  eventType: ProtocolFeedEventType;
  label: string;
  icon: string;
  invoiceId: string;
  amount: string;
  token: string;
  dateLabel: string;
  timestampMs: number;
}

const FEED_EVENT_LABELS: Record<ProtocolFeedEventType, { label: string; icon: string }> = {
  InvoiceSubmitted: { label: "Invoice Submitted", icon: "description" },
  InvoiceFunded: { label: "Invoice Funded", icon: "payments" },
  InvoicePaid: { label: "Invoice Settled", icon: "check_circle" },
  InvoiceDisputed: { label: "Invoice Disputed", icon: "gavel" },
};

export function isProtocolFeedEventType(
  type: ContractEventType,
): type is ProtocolFeedEventType {
  return (PROTOCOL_FEED_EVENT_TYPES as readonly string[]).includes(type);
}

function resolveToken(tokenId: string | undefined): { symbol: string; decimals: number } {
  if (!tokenId) return { symbol: "USDC", decimals: 6 };
  const id = tokenId.toLowerCase();
  if (id === TESTNET_USDC_TOKEN_ID.toLowerCase() || id.includes("usdc")) {
    return { symbol: "USDC", decimals: 6 };
  }
  if (id === TESTNET_EURC_TOKEN_ID.toLowerCase() || id.includes("eurc")) {
    return { symbol: "EURC", decimals: 7 };
  }
  const xlmId = (TESTNET_XLM_TOKEN_ID ?? "").toLowerCase();
  if (id === xlmId || id.includes("xlm") || id.includes("native")) {
    return { symbol: "XLM", decimals: 7 };
  }
  return { symbol: "USDC", decimals: 6 };
}

export function formatFeedAmountValue(amount: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const wholePart = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (decimals === 0 || fraction === 0n) {
    return wholePart;
  }

  const rawFraction = fraction.toString().padStart(decimals, "0");
  const fractionPart = whole === 0n ? rawFraction : rawFraction.replace(/0+$/, "");
  return `${wholePart}.${fractionPart}`;
}

function eventTimestampMs(event: ParsedContractEvent): number {
  if (!event.createdAt) return 0;
  const ts = Date.parse(event.createdAt);
  return Number.isFinite(ts) ? ts : 0;
}

function formatFeedDate(timestampMs: number): string {
  if (timestampMs <= 0) return "—";
  return new Date(timestampMs).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Build the last N homepage feed items from contract events and invoice data. */
export function buildProtocolFeedItems(
  events: ParsedContractEvent[],
  invoicesById: Map<string, Invoice>,
  limit = 10,
): ProtocolFeedItem[] {
  const sorted = [...events]
    .filter((event) => isProtocolFeedEventType(event.type))
    .sort((a, b) => eventTimestampMs(b) - eventTimestampMs(a));

  const items: ProtocolFeedItem[] = [];

  for (const event of sorted) {
    if (items.length >= limit) break;
    if (event.invoiceId === undefined) continue;

    const invoiceId = event.invoiceId.toString();
    const invoice = invoicesById.get(invoiceId);
    const tokenMeta = resolveToken(invoice?.token);
    const amountValue = invoice
      ? formatFeedAmountValue(invoice.amount, tokenMeta.decimals)
      : "—";
    const timestampMs = eventTimestampMs(event);
    const meta = FEED_EVENT_LABELS[event.type];

    items.push({
      id: `${event.type}-${invoiceId}-${timestampMs}-${event.ledger ?? 0}`,
      eventType: event.type,
      label: meta.label,
      icon: meta.icon,
      invoiceId,
      amount: amountValue,
      token: tokenMeta.symbol,
      dateLabel: formatFeedDate(timestampMs),
      timestampMs,
    });
  }

  return items;
}
