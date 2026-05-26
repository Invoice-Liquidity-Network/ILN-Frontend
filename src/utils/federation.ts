import { Federation, Horizon } from "@stellar/stellar-sdk";
import { HORIZON_URL } from "@/constants";

interface ReverseFederationRecord {
  stellar_address?: string;
  stellarAddress?: string;
}

export async function resolveFederationAddress(accountId: string): Promise<string | null> {
  const horizon = new Horizon.Server(HORIZON_URL);
  const account = await horizon.loadAccount(accountId);
  const homeDomain = account.home_domain;

  if (!homeDomain) {
    return null;
  }

  const federation = await Federation.Server.createForDomain(homeDomain);
  const response = await federation.resolveAccountId(accountId) as ReverseFederationRecord;

  return response.stellar_address ?? response.stellarAddress ?? null;
}
