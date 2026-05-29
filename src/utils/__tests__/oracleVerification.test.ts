import { afterEach, describe, expect, it } from "vitest";
import { isOracleVerifiedAddress, isOracleVerificationEnabled } from "../oracleVerification";

describe("oracleVerification", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ORACLE_ENABLED;
    delete process.env.NEXT_PUBLIC_ORACLE_VERIFIED_ADDRESSES;
  });

  it("keeps verification disabled by default", () => {
    expect(isOracleVerificationEnabled()).toBe(false);
    expect(isOracleVerifiedAddress("GABC")).toBe(false);
  });

  it("matches addresses from the public verified-address allowlist", () => {
    process.env.NEXT_PUBLIC_ORACLE_ENABLED = "true";
    process.env.NEXT_PUBLIC_ORACLE_VERIFIED_ADDRESSES = "GAAA, GBBB";

    expect(isOracleVerifiedAddress("GAAA")).toBe(true);
    expect(isOracleVerifiedAddress("GCCC")).toBe(false);
  });
});
