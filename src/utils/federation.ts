import { rpc } from "@stellar/stellar-sdk";
import { RPC_URL } from "@/constants";

const horizonServer = new rpc.Server(RPC_URL);
const federationCache = new Map<string, string>();

interface AccountHomeDomain {
  home_domain?: string;
  homeDomain?: string;
}

export async function resolveFederatedAddress(address: string): Promise<string> {
  if (!address) return address;
  const cached = federationCache.get(address);
  if (cached) return cached;

  try {
    const account = await horizonServer.getAccount(address);
    const { home_domain: homeDomain, homeDomain: camelHomeDomain } = account as AccountHomeDomain;
    const resolvedHomeDomain = homeDomain ?? camelHomeDomain;
    if (!resolvedHomeDomain) return address;

    const stellarTomlResponse = await fetch(`https://${resolvedHomeDomain}/.well-known/stellar.toml`);
    if (!stellarTomlResponse.ok) return address;

    const toml = await stellarTomlResponse.text();
    const match = toml.match(/FEDERATION_SERVER\s*=\s*"([^"]+)"/);
    if (!match) return address;

    const federationServerUrl = match[1].trim();
    const federationResponse = await fetch(
      `${federationServerUrl}?type=account&q=${encodeURIComponent(address)}`
    );

    if (!federationResponse.ok) return address;

    const payload = await federationResponse.json();
    const resolved = typeof payload?.stellar_address === "string" ? payload.stellar_address : address;
    federationCache.set(address, resolved);
    return resolved;
  } catch {
    return address;
  }
}
