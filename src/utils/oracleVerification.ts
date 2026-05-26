const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function isOracleVerificationEnabled(): boolean {
  return TRUE_VALUES.has((process.env.NEXT_PUBLIC_ORACLE_ENABLED ?? "").toLowerCase());
}

export function getOracleVerifiedAddresses(): Set<string> {
  return new Set(
    (process.env.NEXT_PUBLIC_ORACLE_VERIFIED_ADDRESSES ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean),
  );
}

export function isOracleVerifiedAddress(address: string): boolean {
  if (!isOracleVerificationEnabled()) return false;
  return getOracleVerifiedAddresses().has(address.trim());
}
