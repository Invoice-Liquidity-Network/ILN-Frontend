import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isWalletConnectConfigured,
  getWalletConnectPairingUri,
  WalletConnectUnavailableError,
} from "../walletConnect";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("walletConnect connector (#2)", () => {
  it("reports unavailable when no project id is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "");
    expect(isWalletConnectConfigured()).toBe(false);
    expect(() => getWalletConnectPairingUri()).toThrow(WalletConnectUnavailableError);
  });

  it("produces a pairing URI when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "proj123");
    expect(isWalletConnectConfigured()).toBe(true);
    expect(getWalletConnectPairingUri()).toBe("wc:proj123@2?relay-protocol=irn");
  });

  it("treats a whitespace-only project id as unconfigured", () => {
    vi.stubEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "   ");
    expect(isWalletConnectConfigured()).toBe(false);
  });
});
