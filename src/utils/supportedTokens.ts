import {
  TESTNET_EURC_ISSUER,
  TESTNET_EURC_TOKEN_ID,
  TESTNET_USDC_ISSUER,
  TESTNET_USDC_TOKEN_ID,
} from "@/constants";
import { getAllInvoices, getApprovedTokenIds, getTokenMetadata } from "@/utils/soroban";

export interface SupportedTokenInfo {
  contractId: string;
  name: string;
  symbol: string;
  decimals: number;
  assetCode: string;
  issuer: string;
  issuerAddress?: string;
  protocolVolume: bigint;
  acquireUrl: string;
  notes: string[];
  isNative: boolean;
  isLiveAllowlisted: boolean;
  canAddTrustline: boolean;
}

interface StaticTokenInfo {
  assetCode: string;
  issuerAddress?: string;
  issuerLabel?: string;
  acquireUrl: string;
  notes: string[];
}

export const NATIVE_XLM_CONTRACT_ID = "native:xlm";

const STATIC_TOKEN_INFO: Record<string, StaticTokenInfo> = {
  [TESTNET_USDC_TOKEN_ID]: {
    assetCode: "USDC",
    issuerAddress: TESTNET_USDC_ISSUER || undefined,
    issuerLabel: TESTNET_USDC_ISSUER || "Issuer not configured",
    acquireUrl: "https://laboratory.stellar.org/#account-creator?network=test",
    notes: [
      "Used as the default dollar-denominated invoice asset.",
      "Freighter can add the token by contract ID; classic trustline submission uses the configured issuer when available.",
    ],
  },
  [TESTNET_EURC_TOKEN_ID]: {
    assetCode: "EURC",
    issuerAddress: TESTNET_EURC_ISSUER || undefined,
    issuerLabel: TESTNET_EURC_ISSUER || "Issuer not configured",
    acquireUrl: "https://laboratory.stellar.org/#account-creator?network=test",
    notes: [
      "Euro-denominated invoice asset for non-USD settlement.",
      "Freighter can add the token by contract ID; classic trustline submission uses the configured issuer when available.",
    ],
  },
};

export function formatSupportedTokenAmount(amount: bigint, decimals: number, symbol: string): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const trimmedFraction = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  const formatted = trimmedFraction ? `${whole.toString()}.${trimmedFraction}` : whole.toString();
  return `${formatted} ${symbol}`;
}

function volumeByToken(invoices: Awaited<ReturnType<typeof getAllInvoices>>): Map<string, bigint> {
  return invoices.reduce((volumes, invoice) => {
    const tokenId = invoice.token || TESTNET_USDC_TOKEN_ID;
    volumes.set(tokenId, (volumes.get(tokenId) ?? 0n) + invoice.amount);
    return volumes;
  }, new Map<string, bigint>());
}

function buildXlmToken(protocolVolume = 0n, isLiveAllowlisted = true): SupportedTokenInfo {
  return {
    contractId: NATIVE_XLM_CONTRACT_ID,
    name: "Stellar Lumens",
    symbol: "XLM",
    decimals: 7,
    assetCode: "XLM",
    issuer: "Native Stellar asset",
    protocolVolume,
    acquireUrl: "https://laboratory.stellar.org/#account-creator?network=test",
    notes: [
      "Native Stellar asset; no trustline is required.",
      "Amounts use 7 decimal places, matching Stellar stroop precision.",
    ],
    isNative: true,
    isLiveAllowlisted,
    canAddTrustline: false,
  };
}

export function getFallbackSupportedTokens(): SupportedTokenInfo[] {
  const fallbackIds = [TESTNET_USDC_TOKEN_ID, TESTNET_EURC_TOKEN_ID];
  const tokens: SupportedTokenInfo[] = fallbackIds.map((tokenId) => {
    const staticInfo = STATIC_TOKEN_INFO[tokenId];
    const symbol = staticInfo.assetCode;
    return {
      contractId: tokenId,
      name: symbol === "USDC" ? "USD Coin" : "Euro Coin",
      symbol,
      decimals: 7,
      assetCode: symbol,
      issuer: staticInfo.issuerAddress ?? staticInfo.issuerLabel ?? "Issuer not configured",
      issuerAddress: staticInfo.issuerAddress,
      protocolVolume: 0n,
      acquireUrl: staticInfo.acquireUrl,
      notes: staticInfo.notes,
      isNative: false,
      isLiveAllowlisted: false,
      canAddTrustline: Boolean(staticInfo.issuerAddress),
    } satisfies SupportedTokenInfo;
  });

  tokens.push(buildXlmToken(0n, false));
  return tokens;
}

export async function getSupportedTokens(): Promise<SupportedTokenInfo[]> {
  const [tokenIds, invoices] = await Promise.all([getApprovedTokenIds(), getAllInvoices()]);
  const volumes = volumeByToken(invoices);

  const tokens: SupportedTokenInfo[] = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const metadata = await getTokenMetadata(tokenId);
      const staticInfo = STATIC_TOKEN_INFO[tokenId];
      const assetCode = staticInfo?.assetCode ?? metadata.symbol;
      const issuerAddress = staticInfo?.issuerAddress;

      return {
        contractId: tokenId,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        assetCode,
        issuer: issuerAddress ?? staticInfo?.issuerLabel ?? "Issuer not configured",
        issuerAddress,
        protocolVolume: volumes.get(tokenId) ?? 0n,
        acquireUrl: staticInfo?.acquireUrl ?? "https://laboratory.stellar.org/#account-creator?network=test",
        notes: staticInfo?.notes ?? [
          "Live token from the protocol allowlist.",
          "Configure a classic issuer address to enable wallet trustline creation.",
        ],
        isNative: false,
        isLiveAllowlisted: true,
        canAddTrustline: Boolean(issuerAddress),
      } satisfies SupportedTokenInfo;
    })
  );

  if (!tokens.some((token) => token.symbol.toUpperCase() === "XLM")) {
    tokens.push(buildXlmToken(volumes.get(NATIVE_XLM_CONTRACT_ID) ?? 0n));
  }

  return tokens.sort((a, b) => {
    const order = ["USDC", "EURC", "XLM"];
    const aRank = order.indexOf(a.symbol.toUpperCase());
    const bRank = order.indexOf(b.symbol.toUpperCase());
    return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
  });
}
