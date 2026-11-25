export const APPEAL_WINDOW_LEDGERS = 17280;

/**
 * Computes a deterministic, privacy-preserving digest of dispute evidence text
 * so only a fixed-length hash is submitted on-chain (`disputeInvoice`) and no
 * raw document content or PII leaves the client.
 *
 * Assumptions & failure behavior:
 * - Leading/trailing whitespace is trimmed before hashing; blank inputs return `''`.
 * - Uses Web Crypto `SHA-256` (64 lowercase hex chars) when `crypto.subtle` is
 *   available; falls back to a deterministic 32-bit `local-<8 hex>` digest when
 *   `crypto.subtle` is unavailable (e.g. non-secure contexts).
 * - Never logs input text or intermediate values.
 * - Residual risk: the non-crypto fallback is not collision-resistant and
 *   produces a different format (`local-...`) than SHA-256.
 */
export async function hashEvidence(text: string): Promise<string> {
  const normalized = text.trim();
  if (!normalized) return '';

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `local-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export function formatLedgerWindow(ledgersRemaining: number): string {
  const safeLedgers = Math.max(0, Math.floor(ledgersRemaining));
  const minutes = Math.round((safeLedgers * 5) / 60);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);

  if (days > 0) return `${safeLedgers.toLocaleString()} ledgers (${days}d ${hours}h)`;
  return `${safeLedgers.toLocaleString()} ledgers (${hours}h)`;
}
