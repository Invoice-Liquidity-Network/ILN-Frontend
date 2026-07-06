import { describe, it, expect } from "vitest";
import type { ParsedContractEvent } from "@/lib/contract-events";
import type { Invoice } from "@/utils/soroban";
import {
  buildProtocolFeedItems,
  formatFeedAmountValue,
  isProtocolFeedEventType,
} from "@/utils/protocol-feed";

function makeInvoice(id: bigint, overrides: Partial<Invoice> = {}): Invoice {
  return {
    id,
    status: "Funded",
    freelancer: "GAAAA",
    payer: "GBBBB",
    amount: 100_000_000n,
    due_date: 1n,
    discount_rate: 300,
    token: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
    ...overrides,
  };
}

describe("isProtocolFeedEventType", () => {
  it("includes feed event types only", () => {
    expect(isProtocolFeedEventType("InvoiceSubmitted")).toBe(true);
    expect(isProtocolFeedEventType("InvoiceFunded")).toBe(true);
    expect(isProtocolFeedEventType("InvoicePaid")).toBe(true);
    expect(isProtocolFeedEventType("InvoiceDisputed")).toBe(true);
    expect(isProtocolFeedEventType("InvoiceCancelled")).toBe(false);
  });
});

describe("buildProtocolFeedItems", () => {
  const invoices = new Map<string, Invoice>([
    ["42", makeInvoice(42n)],
    ["7", makeInvoice(7n, { amount: 50_000_000n })],
  ]);

  const events: ParsedContractEvent[] = [
    { type: "InvoiceFunded", invoiceId: 42n, createdAt: "2025-06-15T10:00:00.000Z", ledger: 1 },
    { type: "InvoicePaid", invoiceId: 7n, createdAt: "2025-06-15T11:00:00.000Z", ledger: 2 },
    { type: "InvoiceCancelled", invoiceId: 99n, createdAt: "2025-06-15T12:00:00.000Z", ledger: 3 },
    { type: "InvoiceSubmitted", invoiceId: 42n, createdAt: "2025-06-14T09:00:00.000Z", ledger: 4 },
  ];

  it("returns at most 10 items sorted newest first", () => {
    const items = buildProtocolFeedItems(events, invoices, 10);
    expect(items).toHaveLength(3);
    expect(items[0]?.eventType).toBe("InvoicePaid");
    expect(items[1]?.eventType).toBe("InvoiceFunded");
    expect(items[2]?.eventType).toBe("InvoiceSubmitted");
  });

  it("maps event labels and invoice fields", () => {
    const items = buildProtocolFeedItems(events, invoices, 10);
    const funded = items.find((item) => item.eventType === "InvoiceFunded");
    expect(funded?.label).toBe("Invoice Funded");
    expect(funded?.icon).toBe("payments");
    expect(funded?.amount).toBe("100");
    expect(funded?.token).toBe("USDC");
    expect(funded?.invoiceId).toBe("42");
  });

  it("labels settled events as Invoice Settled", () => {
    const items = buildProtocolFeedItems(events, invoices, 10);
    expect(items[0]?.label).toBe("Invoice Settled");
  });
});

describe("formatFeedAmountValue", () => {
  it("formats token amounts without symbol suffix", () => {
    expect(formatFeedAmountValue(100_000_000n, 6)).toBe("100");
  });
});
