import { dedupedFetch, fetchHomeDomain, TTL } from "@/lib/horizonClient";

/**
 * Resolves a Stellar address to its federation address (e.g. alice*example.com).
 *
 * Uses horizonClient for:
 *  - Deduplication: concurrent calls for the same address share one promise.
 *  - Caching: result cached for TTL.FEDERATION (10 min).
 */
export async function resolveFederatedAddress(address: string): Promise<string> {
  if (!address) return address;

  return dedupedFetch(
    `federation:${address}`,
    async () => {
      try {
        const homeDomain = await fetchHomeDomain(address);
        if (!homeDomain) return address;

        const stellarTomlResponse = await fetch(
          `https://${homeDomain}/.well-known/stellar.toml`,
        );
        if (!stellarTomlResponse.ok) return address;

        const toml = await stellarTomlResponse.text();
        const match = toml.match(/FEDERATION_SERVER\s*=\s*"([^"]+)"/);
        if (!match) return address;

        const federationServerUrl = match[1].trim();
        const federationResponse = await fetch(
          `${federationServerUrl}?type=account&q=${encodeURIComponent(address)}`,
        );
        if (!federationResponse.ok) return address;

        const payload = await federationResponse.json();
        return typeof payload?.stellar_address === "string"
          ? payload.stellar_address
          : address;
      } catch {
        return address;
      }
    },
    TTL.FEDERATION,
  );
}
