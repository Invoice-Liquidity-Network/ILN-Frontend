import { describe, expect, it } from "vitest";
import { hashDisputeEvidence } from "../disputeEvidence";

describe("hashDisputeEvidence", () => {
  it("hashes trimmed evidence text with SHA-256", async () => {
    await expect(hashDisputeEvidence(" hello ")).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});
