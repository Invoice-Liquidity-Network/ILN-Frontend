import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatNetworkLabel,
  getConfiguredStellarNetwork,
  networksMatch,
  normalizeWalletNetwork,
} from "@/utils/network";

describe("network utils", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes wallet network names", () => {
    expect(normalizeWalletNetwork("TESTNET")).toBe("testnet");
    expect(normalizeWalletNetwork("PUBLIC")).toBe("mainnet");
    expect(normalizeWalletNetwork("mainnet")).toBe("mainnet");
  });

  it("detects matching and mismatching networks", () => {
    vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
    expect(networksMatch("TESTNET")).toBe(true);
    expect(networksMatch("PUBLIC")).toBe(false);
    expect(getConfiguredStellarNetwork()).toBe("testnet");
  });

  it("formats network labels for UI", () => {
    expect(formatNetworkLabel("testnet")).toBe("Testnet");
    expect(formatNetworkLabel("PUBLIC")).toBe("Mainnet");
  });
});
