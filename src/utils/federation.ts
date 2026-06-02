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

/**
 * Resolves a federation name (e.g. alice*example.com) to a Stellar address.
 */
export async function resolveStellarAddressFromName(name: string): Promise<string> {
  if (!name.includes("*")) {
    throw new Error("Invalid federation name: must contain '*'");
  }

  const [, domain] = name.split("*");
  if (!domain) {
    throw new Error("Invalid federation name: missing domain");
  }

  return dedupedFetch(
    `federation_name:${name}`,
    async () => {
      try {
        const stellarTomlResponse = await fetch(`https://${domain}/.well-known/stellar.toml`);
        if (!stellarTomlResponse.ok) {
          throw new Error(`Federation not supported by ${domain}`);
        }

        const toml = await stellarTomlResponse.text();
        const match = toml.match(/FEDERATION_SERVER\s*=\s*"([^"]+)"/);
        if (!match) {
          throw new Error(`No FEDERATION_SERVER found for ${domain}`);
        }

        const federationServerUrl = match[1].trim();
        const federationResponse = await fetch(
          `${federationServerUrl}?type=name&q=${encodeURIComponent(name)}`
        );
        
        if (!federationResponse.ok) {
          throw new Error(`Failed to resolve name ${name}`);
        }

        const payload = await federationResponse.json();
        if (typeof payload?.account_id === "string") {
          return payload.account_id;
        }

        throw new Error("Invalid response from federation server");
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`Unable to resolve federation address: ${String(err)}`);
      }
    },
    TTL.FEDERATION
  );
}
