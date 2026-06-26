import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We re-import the module after manipulating the env so we need to use dynamic import
// and vi.resetModules between tests that toggle the flag.

describe("OracleBadge", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("when NEXT_PUBLIC_ORACLE_ENABLED=true", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_ORACLE_ENABLED", "true");
    });

    it("renders a green verified badge for oracle-verified payers", async () => {
      const { default: OracleBadge } = await import("@/components/OracleBadge");
      render(<OracleBadge verified={true} />);
      const badge = screen.getByTitle(
        "This address has been verified by the ILN off-chain oracle",
      );
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toMatch(/Oracle Verified/i);
      expect(badge.className).toMatch(/green/);
    });

    it("renders a grey unverified indicator for non-verified payers", async () => {
      const { default: OracleBadge } = await import("@/components/OracleBadge");
      render(<OracleBadge verified={false} />);
      const badge = screen.getByTitle(
        "This address has not been verified by the ILN off-chain oracle",
      );
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toMatch(/Unverified/i);
      expect(badge.className).not.toMatch(/green/);
    });
  });

  describe("when NEXT_PUBLIC_ORACLE_ENABLED is not set", () => {
    it("renders nothing", async () => {
      vi.stubEnv("NEXT_PUBLIC_ORACLE_ENABLED", "false");
      const { default: OracleBadge } = await import("@/components/OracleBadge");
      const { container } = render(<OracleBadge verified={true} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
