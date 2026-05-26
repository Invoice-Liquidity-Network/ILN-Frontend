import { Federation, Horizon, rpc } from "@stellar/stellar-sdk";
import { HORIZON_URL, RPC_URL } from "@/constants";

interface ReverseFederationRecord {
  stellar_address?: string;
  stellarAddress?: string;
}

interface AccountHomeDomain {
  home_domain?: string;
  homeDomain?: string;
}

const horizonServer = new rpc.Server(RPC_URL);
const federationCache = new Map<string, string>();

export async function resolveFederationAddress(accountId: string): Promise<string | null> {
  const horizon = new Horizon.Server(HORIZON_URL);
  const account = await horizon.loadAccount(accountId) as AccountHomeDomain;
  const homeDomain = account.home_domain ?? account.homeDomain;

  if (!homeDomain) {
    return null;
  }

  const federation = await Federation.Server.createForDomain(homeDomain);
  const response = await federation.resolveAccountId(accountId) as ReverseFederationRecord;

  return response.stellar_address ?? response.stellarAddress ?? null;
}

export async function resolveFederatedAddress(address: string): Promise<string> {
  if (!address) return address;
  const cached = federationCache.get(address);
  if (cached) return cached;

  try {
    const account = await horizonServer.getAccount(address);
    const { home_domain: homeDomainSnake, homeDomain: homeDomainCamel } = account as AccountHomeDomain;
    const homeDomain = homeDomainSnake ?? homeDomainCamel;
    if (!homeDomain) return address;

    const stellarTomlResponse = await fetch(`https://${homeDomain}/.well-known/stellar.toml`);
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
