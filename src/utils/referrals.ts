/**
 * Generates a deterministic referral code from a wallet address.
 * Uses SHA-256 and returns the first 8 characters of the hex representation.
 */
export async function generateReferralCode(address: string): Promise<string> {
  if (!address) return '';

  // Use SubtleCrypto for SHA-256
  const msgUint8 = new TextEncoder().encode(address);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex.slice(0, 8).toUpperCase();
}

/**
 * Returns the full referral link for a given code.
 */
export function getReferralLink(code: string): string {
  if (typeof window === 'undefined') return `/submit?ref=${code}`;
  const origin = window.location.origin;
  return `${origin}/submit?ref=${code}`;
}
