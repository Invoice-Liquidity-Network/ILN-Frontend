import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "../ErrorBoundary";

function ContractSection({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("RPC unavailable");
  }

  return <div>Contract data loaded</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders retry UI when a section throws", () => {
    render(
      <ErrorBoundary>
        <ContractSection shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong loading this section.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("restores the section after retry succeeds", async () => {
    function RetryHarness() {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary onRetry={() => setShouldThrow(false)}>
          <ContractSection shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    const user = userEvent.setup();
    render(<RetryHarness />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText("Contract data loaded")).toBeInTheDocument();
  });
});
