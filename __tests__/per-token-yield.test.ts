import { calculatePerTokenMetrics, calculateTokenAllocations } from "@/utils/per-token-yield";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import type { Invoice } from "@/utils/soroban";

describe("Per-token yield utilities", () => {
  it("calculates USD allocation based on per-token metrics", () => {
    const usdcToken = {
      contractId: "USDC",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 7,
      iconLabel: "US",
    } as ApprovedToken;

    const eurcToken = {
      contractId: "EURC",
      name: "Euro Coin",
      symbol: "EURC",
      decimals: 7,
      iconLabel: "EU",
    } as ApprovedToken;

    const invoices: Invoice[] = [
      {
        id: 1n,
        status: "Funded",
        freelancer: "GFREELANCER1",
        payer: "GPAYER1",
        amount: 10_000_000n,
        due_date: 0n,
        discount_rate: 500,
        token: "USDC",
      },
      {
        id: 2n,
        status: "Paid",
        freelancer: "GFREELANCER2",
        payer: "GPAYER2",
        amount: 20_000_000n,
        due_date: 0n,
        discount_rate: 1000,
        token: "EURC",
      },
    ];

    const tokenMap = new Map([
      [usdcToken.contractId, usdcToken],
      [eurcToken.contractId, eurcToken],
    ]);

    const metrics = calculatePerTokenMetrics(invoices, tokenMap, usdcToken);
    const allocation = calculateTokenAllocations(metrics);

    expect(allocation).toHaveLength(2);
    expect(allocation[0].token.symbol).toBe("EURC");
    expect(allocation[0].usdEquivalent).toBe(21_600_000n);
    expect(allocation[1].usdEquivalent).toBe(10_000_000n);
    expect(allocation[0].percentage).toBeCloseTo(68.35, 1);
    expect(allocation[1].percentage).toBeCloseTo(31.65, 1);
  });
});
