import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import VerificationBadge from "../VerificationBadge";

describe("VerificationBadge", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ORACLE_ENABLED;
  });

  it("does not render when oracle verification is disabled", () => {
    render(<VerificationBadge verified />);

    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("renders verified state with oracle tooltip copy", () => {
    process.env.NEXT_PUBLIC_ORACLE_ENABLED = "true";

    render(<VerificationBadge verified />);

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "This address has been verified by the ILN off-chain oracle",
    );
  });

  it("renders the neutral unverified state when enabled", () => {
    process.env.NEXT_PUBLIC_ORACLE_ENABLED = "true";

    render(<VerificationBadge verified={false} />);

    expect(screen.getByText("Unverified")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "This address has not been verified by the ILN off-chain oracle",
    );
  });
});
