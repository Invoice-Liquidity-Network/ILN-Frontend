/**
 * Extended contract-events tests to cover uncovered branches:
 * - base64 decoding in decodeTopicInvoiceId (lines 53-64)
 * - parseContractEvent returning null for unknown events (line 73)
 * - fallback JSON string parsing (lines 97-113)
 * - statusForContractEvent for all event types
 * - applyContractEventToInvoices edge cases
 * - unsuccessful transaction filtering
 */
import { describe, it, expect } from 'vitest';
import {
  parseContractEventsFromTransaction,
  applyContractEventToInvoices,
  statusForContractEvent,
  reconnectDelayMs,
  CONTRACT_EVENT_TYPES,
} from '@/lib/contract-events';
import type { Invoice } from '@/utils/soroban';

const sampleInvoices: Invoice[] = [
  {
    id: 42n,
    status: 'Pending',
    freelancer: 'GFR',
    payer: 'GP',
    amount: 100n,
    due_date: 1n,
    discount_rate: 100,
  },
  {
    id: 99n,
    status: 'Funded',
    freelancer: 'GFR2',
    payer: 'GP2',
    amount: 200n,
    due_date: 2n,
    discount_rate: 150,
  },
];

describe('contract-events – decodeTopicInvoiceId branches', () => {
  it('decodes a base64-encoded invoice ID from topics', () => {
    // Create a base64 string that represents a valid 8-byte bigint
    // 8 bytes of zeros + value 42 in the last byte
    const bytes = new Uint8Array(8);
    bytes[7] = 42;
    const b64 = btoa(String.fromCharCode(...bytes));

    const events = parseContractEventsFromTransaction({
      successful: true,
      ledger: 10,
      events: {
        contractEvents: [{ topics: ['InvoiceFunded', b64] }],
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].invoiceId).toBe(42n);
  });

  it('returns undefined invoiceId for short base64 (< 8 bytes)', () => {
    // Create a 4-byte base64 (too short for the 8-byte decode path)
    const bytes = new Uint8Array(4);
    bytes[3] = 7;
    const b64 = btoa(String.fromCharCode(...bytes));

    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{ topics: ['InvoicePaid', b64] }],
      },
    });

    expect(events).toHaveLength(1);
    // The b64 is 8 chars long (4 bytes encodes to 8 base64 chars) but decodes to <8 bytes
    // So invoiceId should be undefined
    expect(events[0].invoiceId).toBeUndefined();
  });

  it('returns undefined invoiceId when topics has only one entry', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{ topics: ['InvoiceSubmitted'] }],
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].invoiceId).toBeUndefined();
  });

  it('returns undefined invoiceId when second topic is empty', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{ topics: ['InvoiceSubmitted', ''] }],
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].invoiceId).toBeUndefined();
  });

  it('returns undefined when base64 decode throws', () => {
    // Invalid base64 that will cause atob to throw
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{ topics: ['InvoiceCancelled', '!!!invalid-base64!!!'] }],
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].invoiceId).toBeUndefined();
  });
});

describe('contract-events – parseContractEvent null path', () => {
  it('filters out events with unknown event types', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [
          { topics: ['UnknownEventType', '42'] },
          { topics: ['InvoiceFunded', '42'] },
        ],
      },
    });

    // Only InvoiceFunded should be parsed
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('InvoiceFunded');
  });

  it('returns empty array when all events are unknown types', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{ topics: ['SomeRandomEvent'] }],
      },
    });

    // No structured events matched, and no fallback match either
    expect(events).toHaveLength(0);
  });

  it('falls back to entry.type when topics[0] is absent', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{ type: 'InvoiceDisputed' }],
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('InvoiceDisputed');
  });

  it('falls back to entry.id when topics and type are absent', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{ id: 'InvoicePaid' }],
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('InvoicePaid');
  });

  it('returns null for event with no topics, type, or id', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: {
        contractEvents: [{}],
      },
    });

    expect(events).toHaveLength(0);
  });
});

describe('contract-events – fallback JSON parsing (lines 97-113)', () => {
  it('extracts events from serialized JSON when no structured contractEvents', () => {
    // The fallback path: no contractEvents, but event type name appears as a
    // JSON string in the serialized tx. The regex looks for '"EventType"'.
    const tx = {
      successful: true,
      ledger: 500,
      created_at: '2025-06-01T00:00:00Z',
      event_type: 'InvoiceSubmitted',
      invoice_id: '123',
    };

    const events = parseContractEventsFromTransaction(tx as any);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('InvoiceSubmitted');
    expect(events[0].ledger).toBe(500);
    expect(events[0].createdAt).toBe('2025-06-01T00:00:00Z');
    expect(events[0].invoiceId).toBe(123n);
  });

  it('extracts multiple event types from fallback', () => {
    const tx = {
      successful: true,
      ledger: 501,
      event1: 'InvoiceFunded',
      event2: 'InvoicePaid',
      invoice_id: '456',
    };

    const events = parseContractEventsFromTransaction(tx as any);
    expect(events.length).toBe(2);
  });

  it('handles fallback with no invoice_id field', () => {
    const tx = {
      successful: true,
      event_type: 'InvoiceCancelled',
    };

    const events = parseContractEventsFromTransaction(tx as any);
    const cancelled = events.find((e) => e.type === 'InvoiceCancelled');
    expect(cancelled).toBeDefined();
    expect(cancelled!.invoiceId).toBeUndefined();
  });

  it('returns empty for unsuccessful transactions', () => {
    const events = parseContractEventsFromTransaction({
      successful: false,
      events: {
        contractEvents: [{ topics: ['InvoiceFunded', '42'] }],
      },
    });

    expect(events).toHaveLength(0);
  });

  it('returns empty when tx has no events and no event types in body', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
    });

    expect(events).toHaveLength(0);
  });

  it('returns empty when contractEvents exist but are empty', () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      events: { contractEvents: [] },
    });

    expect(events).toHaveLength(0);
  });

  it('skips event types that appear without quotes match', () => {
    // Include type name in a way that JSON.stringify includes it but
    // the regex match for '"EventType"' does NOT match
    const tx = {
      successful: true,
      // 'InvoiceDisputed' won't appear as a standalone quoted value in serialized form
      // because it's inside the key name
      InvoiceDisputedKey: true,
    };
    // "InvoiceDisputed" appears in key "InvoiceDisputedKey" so serialized.includes works
    // but regex '"(InvoiceDisputed)"' won't match '"InvoiceDisputedKey"'
    const events = parseContractEventsFromTransaction(tx as any);
    // Should not extract it since the regex won't match as a standalone value
    expect(events.filter((e) => e.type === 'InvoiceDisputed')).toHaveLength(0);
  });
});

describe('contract-events – statusForContractEvent', () => {
  it('maps InvoiceSubmitted to Pending', () => {
    expect(statusForContractEvent('InvoiceSubmitted')).toBe('Pending');
  });

  it('maps InvoiceFunded to Funded', () => {
    expect(statusForContractEvent('InvoiceFunded')).toBe('Funded');
  });

  it('maps InvoicePaid to Paid', () => {
    expect(statusForContractEvent('InvoicePaid')).toBe('Paid');
  });

  it('maps InvoiceDisputed to Disputed', () => {
    expect(statusForContractEvent('InvoiceDisputed')).toBe('Disputed');
  });

  it('maps InvoiceCancelled to Cancelled', () => {
    expect(statusForContractEvent('InvoiceCancelled')).toBe('Cancelled');
  });
});

describe('contract-events – applyContractEventToInvoices edge cases', () => {
  it('returns undefined invoices unchanged', () => {
    const result = applyContractEventToInvoices(undefined, {
      type: 'InvoiceFunded',
      invoiceId: 42n,
    });
    expect(result).toBeUndefined();
  });

  it('returns invoices unchanged when event has no invoiceId', () => {
    const result = applyContractEventToInvoices(sampleInvoices, {
      type: 'InvoiceFunded',
    });
    expect(result).toBe(sampleInvoices);
  });

  it('only updates the matching invoice', () => {
    const result = applyContractEventToInvoices(sampleInvoices, {
      type: 'InvoicePaid',
      invoiceId: 42n,
    });

    expect(result).toHaveLength(2);
    expect(result![0].status).toBe('Paid');
    expect(result![1].status).toBe('Funded'); // unchanged
  });

  it('does not modify invoices when no ID matches', () => {
    const result = applyContractEventToInvoices(sampleInvoices, {
      type: 'InvoiceCancelled',
      invoiceId: 999n,
    });

    expect(result).toHaveLength(2);
    expect(result![0].status).toBe('Pending');
    expect(result![1].status).toBe('Funded');
  });
});

describe('contract-events – CONTRACT_EVENT_TYPES', () => {
  it('contains all five event types', () => {
    expect(CONTRACT_EVENT_TYPES).toHaveLength(5);
    expect(CONTRACT_EVENT_TYPES).toContain('InvoiceSubmitted');
    expect(CONTRACT_EVENT_TYPES).toContain('InvoiceFunded');
    expect(CONTRACT_EVENT_TYPES).toContain('InvoicePaid');
    expect(CONTRACT_EVENT_TYPES).toContain('InvoiceDisputed');
    expect(CONTRACT_EVENT_TYPES).toContain('InvoiceCancelled');
  });
});

describe('contract-events – reconnectDelayMs edge cases', () => {
  it('clamps to maxMs', () => {
    const delay = reconnectDelayMs(20, 1000, 30_000);
    expect(delay).toBeLessThanOrEqual(30_250); // max + jitter
  });

  it('supports custom baseMs', () => {
    const delay = reconnectDelayMs(0, 500, 30_000);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThan(750);
  });

  it('handles negative attempt gracefully', () => {
    const delay = reconnectDelayMs(-1, 1000, 30_000);
    expect(delay).toBeGreaterThanOrEqual(1000);
  });
});
