import { describe, expect, it } from "vitest";
import { FEE_ON_TRANSFER_TOKEN_ERROR, mapGovernanceErrorMessage } from "../governance";

describe("governance error mapping", () => {
  it("maps contract fee-on-transfer errors to a user-facing token rejection message", () => {
    expect(mapGovernanceErrorMessage(new Error("HostError: Error(Contract, #FeeOnTransferToken)"))).toBe(
      FEE_ON_TRANSFER_TOKEN_ERROR,
    );
  });

  it("preserves unrelated errors", () => {
    expect(mapGovernanceErrorMessage(new Error("User rejected transaction"))).toBe("User rejected transaction");
  });
});
