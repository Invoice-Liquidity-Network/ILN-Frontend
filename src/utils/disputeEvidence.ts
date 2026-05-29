export async function hashDisputeEvidence(evidence: string): Promise<string> {
  const normalized = evidence.trim();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
