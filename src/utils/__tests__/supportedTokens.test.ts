import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getFallbackSupportedTokens,
  getSupportedTokens,
  formatSupportedTokenAmount,
} from "@/utils/supportedTokens";
import {
  TESTNET_EURC_TOKEN_ID,
  TESTNET_USDC_TOKEN_ID,
} from "@/constants";

vi.mock("@/utils/soroban", () => ({
  getApprovedTokenIds: vi.fn(),
  getAllInvoices: vi.fn(),
  getTokenMetadata: vi.fn(),
}));

import { getAllInvoices, getApprovedTokenIds, getTokenMetadata } from "@/utils/soroban";

const mockedGetApprovedTokenIds = vi.mocked(getApprovedTokenIds);
const mockedGetAllInvoices = vi.mocked(getAllInvoices);
const mockedGetTokenMetadata = vi.mocked(getTokenMetadata);

describe("supported token utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetApprovedTokenIds.mockResolvedValue([TESTNET_USDC_TOKEN_ID, TESTNET_EURC_TOKEN_ID]);
    mockedGetAllInvoices.mockResolvedValue([
      {
        id: 1n,
        status: "Funded",
        freelancer: "GFR",
        payer: "GPY",
        amount: 12_500_000n,
        due_date: 1n,
        discount_rate: 200,
        token: TESTNET_USDC_TOKEN_ID,
      },
      {
        id: 2n,
        status: "Open",
        freelancer: "GFR",
        payer: "GPY",
        amount: 4_000_000n,
        due_date: 1n,
        discount_rate: 200,
        token: TESTNET_EURC_TOKEN_ID,
      },
      {
        id: 3n,
        status: "Open",
        freelancer: "GFR",
        payer: "GPY",
        amount: 1_000_000n,
        due_date: 1n,
        discount_rate: 200,
      },
    ]);
    mockedGetTokenMetadata.mockImplementation(async (tokenId) => ({
      contractId: tokenId,
      name: tokenId === TESTNET_USDC_TOKEN_ID ? "USD Coin" : "Euro Coin",
      symbol: tokenId === TESTNET_USDC_TOKEN_ID ? "USDC" : "EURC",
      decimals: 7,
    }));
  });

  it("combines live allowlist metadata with protocol volume", async () => {
    const tokens = await getSupportedTokens();

    expect(tokens.map((token) => token.symbol)).toEqual(["USDC", "EURC", "XLM"]);
    expect(tokens[0]).toMatchObject({
      assetCode: "USDC",
      protocolVolume: 13_500_000n,
      isLiveAllowlisted: true,
      isNative: false,
    });
    expect(tokens[1].protocolVolume).toBe(4_000_000n);
  });

  it("adds native XLM with precision guidance even when it is not contract allowlisted", async () => {
    const tokens = await getSupportedTokens();
    const xlm = tokens.find((token) => token.symbol === "XLM");

    expect(xlm).toMatchObject({
      assetCode: "XLM",
      issuer: "Native Stellar asset",
      decimals: 7,
      canAddTrustline: false,
    });
    expect(xlm?.notes.join(" ")).toContain("7 decimal places");
  });

  it("formats smallest-unit token amounts without trailing zeroes", () => {
    expect(formatSupportedTokenAmount(12_500_000n, 7, "USDC")).toBe("1.25 USDC");
    expect(formatSupportedTokenAmount(10_000_000n, 7, "XLM")).toBe("1 XLM");
  });

  it("provides configured fallback rows when the live allowlist is unavailable", () => {
    const fallback = getFallbackSupportedTokens();

    expect(fallback.map((token) => token.symbol)).toEqual(["USDC", "EURC", "XLM"]);
    expect(fallback.every((token) => token.isLiveAllowlisted === false)).toBe(true);
  });
});
