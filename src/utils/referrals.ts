const REFERRAL_CODE_REGEX = /^[0-9A-F]{8}$/;

/**
 * Normalizes and validates a referral code against the canonical 8-character
 * uppercase hex format. Returns `null` for malformed or empty codes.
 */
export function normalizeReferralCode(code: string): string | null {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return REFERRAL_CODE_REGEX.test(normalized) ? normalized : null;
}

export function isValidReferralCode(code: string): boolean {
  return normalizeReferralCode(code) !== null;
}

/**
 * Generates a deterministic referral code from a wallet address.
 * Normalizes whitespace and casing before hashing with SHA-256 and returning
 * the first 8 uppercase hex characters.
 *
 * Residual risk:
 * - Truncating SHA-256 to 32 bits (8 hex chars) has a non-zero birthday collision
 *   probability at scale (~65k+ addresses). Authoritative referrer binding and
 *   reward payouts must be enforced by the backend/contract using full addresses.
 */
export async function generateReferralCode(address: string): Promise<string> {
  const normalized = typeof address === 'string' ? address.trim().toUpperCase() : '';
  if (!normalized) return '';

  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex.slice(0, 8).toUpperCase();
}

/**
 * Returns the full referral link for a given code, URL-encoding the normalized
 * code to prevent query-parameter injection or attribution ambiguity.
 * Returns an empty string if the code is blank.
 */
export function getReferralLink(code: string): string {
  const trimmed = typeof code === 'string' ? code.trim() : '';
  if (!trimmed) return '';
  const safeCode = encodeURIComponent(trimmed);
  if (typeof window === 'undefined') return `/submit?ref=${safeCode}`;
  const origin = window.location.origin;
  return `${origin}/submit?ref=${safeCode}`;
}

// ─── Replay & Attribution Ambiguity Protection (#1317) ───────────────────────

export interface ReferralCodeRecord {
  code: string;
  referrerAddress: string;
  /** Epoch milliseconds after which the code is expired; null/undefined means non-expiring. */
  expiresAt?: number | null;
  revoked?: boolean;
}

export interface ReferralAttributionEvent {
  /** Unique idempotency key (e.g. `txHash:eventIndex` or `join:<referee>`). */
  eventId: string;
  type: 'join' | 'reward';
  code: string;
  refereeAddress: string;
  rewardAmount: number;
}

export type ReferralRejectionReason =
  | 'invalid_event_id'
  | 'replayed_event'
  | 'invalid_code'
  | 'revoked_code'
  | 'expired_code'
  | 'invalid_referee'
  | 'self_referral'
  | 'duplicate_join'
  | 'duplicate_join_conflict'
  | 'invalid_reward';

export interface ReferralAttributionLedger {
  /** First-touch canonical attribution: normalized referee address -> normalized referrer address. */
  attributedReferrerByReferee: Record<string, string>;
  /** Processed event IDs for idempotent replay protection. */
  processedEventIds: string[];
  /** Cumulative attributed rewards per normalized referrer address. */
  rewardsByReferrer: Record<string, number>;
}

export type ReferralAttributionResult =
  | { accepted: true; ledger: ReferralAttributionLedger }
  | { accepted: false; reason: ReferralRejectionReason; ledger: ReferralAttributionLedger };

export function createReferralAttributionLedger(): ReferralAttributionLedger {
  return {
    attributedReferrerByReferee: {},
    processedEventIds: [],
    rewardsByReferrer: {},
  };
}

/**
 * Pure state transition for referral attribution and reward accounting.
 *
 * Enforces:
 * - Replay idempotency via `eventId` (replayed events cannot double-credit rewards).
 * - Code format, registry lookup, revocation, and expiration checks.
 * - Self-referral rejection (`refereeAddress === referrerAddress`).
 * - First-touch attribution immutability (duplicate joins cannot re-credit a join
 *   bonus or reassign an already-attributed referee to a different referrer).
 */
export function applyReferralAttribution(
  ledger: ReferralAttributionLedger,
  event: ReferralAttributionEvent,
  registry: ReadonlyMap<string, ReferralCodeRecord> | Record<string, ReferralCodeRecord>,
  now: number = Date.now()
): ReferralAttributionResult {
  const eventId = typeof event.eventId === 'string' ? event.eventId.trim() : '';
  if (!eventId) {
    return { accepted: false, reason: 'invalid_event_id', ledger };
  }
  if (ledger.processedEventIds.includes(eventId)) {
    return { accepted: false, reason: 'replayed_event', ledger };
  }

  const normalizedCode = normalizeReferralCode(event.code);
  if (!normalizedCode) {
    return { accepted: false, reason: 'invalid_code', ledger };
  }

  const record =
    registry instanceof Map ? registry.get(normalizedCode) : registry[normalizedCode];
  if (!record || !record.referrerAddress?.trim()) {
    return { accepted: false, reason: 'invalid_code', ledger };
  }

  if (record.revoked) {
    return { accepted: false, reason: 'revoked_code', ledger };
  }

  if (
    record.expiresAt !== undefined &&
    record.expiresAt !== null &&
    (!Number.isFinite(record.expiresAt) || now > record.expiresAt)
  ) {
    return { accepted: false, reason: 'expired_code', ledger };
  }

  const normalizedReferee =
    typeof event.refereeAddress === 'string' ? event.refereeAddress.trim().toUpperCase() : '';
  if (!normalizedReferee) {
    return { accepted: false, reason: 'invalid_referee', ledger };
  }

  const normalizedReferrer = record.referrerAddress.trim().toUpperCase();
  if (normalizedReferee === normalizedReferrer) {
    return { accepted: false, reason: 'self_referral', ledger };
  }

  if (
    typeof event.rewardAmount !== 'number' ||
    !Number.isFinite(event.rewardAmount) ||
    event.rewardAmount < 0
  ) {
    return { accepted: false, reason: 'invalid_reward', ledger };
  }

  const existingReferrer = ledger.attributedReferrerByReferee[normalizedReferee];
  if (existingReferrer) {
    if (existingReferrer !== normalizedReferrer) {
      return { accepted: false, reason: 'duplicate_join_conflict', ledger };
    }
    if (event.type === 'join') {
      return { accepted: false, reason: 'duplicate_join', ledger };
    }
  }

  const nextLedger: ReferralAttributionLedger = {
    attributedReferrerByReferee: {
      ...ledger.attributedReferrerByReferee,
      [normalizedReferee]: normalizedReferrer,
    },
    processedEventIds: [...ledger.processedEventIds, eventId],
    rewardsByReferrer: {
      ...ledger.rewardsByReferrer,
      [normalizedReferrer]: (ledger.rewardsByReferrer[normalizedReferrer] ?? 0) + event.rewardAmount,
    },
  };

  return { accepted: true, ledger: nextLedger };
}
