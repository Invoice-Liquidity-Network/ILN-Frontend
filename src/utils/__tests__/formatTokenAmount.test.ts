import { describe, expect, it } from "vitest";
import { formatTokenAmount, tokenAmountToNumber } from "../formatTokenAmount";

describe("formatTokenAmount", () => {
  it("formats USDC with 6 decimal base units", () => {
    expect(formatTokenAmount(1_234_560_000n, { symbol: "USDC", decimals: 6 })).toBe(
      "1,234.56 USDC",
    );
  });

  it("keeps precision for small 7-decimal XLM amounts", () => {
    expect(formatTokenAmount(100n, { symbol: "XLM", decimals: 7 })).toBe("0.0000100 XLM");
  });

  it("formats zero and large values", () => {
    expect(formatTokenAmount(0n, { symbol: "EURC", decimals: 6 })).toBe("0 EURC");
    expect(formatTokenAmount(9_876_543_210_000n, { symbol: "USDC", decimals: 6 })).toBe(
      "9,876,543.21 USDC",
    );
  });

  it("converts token amounts using token decimals", () => {
    expect(tokenAmountToNumber(1_500_000n, { decimals: 6 })).toBe(1.5);
    expect(tokenAmountToNumber(15_000_000n, { decimals: 7 })).toBe(1.5);
  });
});
