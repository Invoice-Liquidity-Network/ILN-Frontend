import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import QuorumProgressBar from "@/components/QuorumProgressBar";

describe("QuorumProgressBar", () => {
  it("shows quorum not met with red styling context", () => {
    render(<QuorumProgressBar votesCast={40_000} quorumRequired={100_000} />);
    expect(screen.getByText(/Quorum: 40\.0K \/ 100\.0K required \(40%\)/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar.querySelector(".bg-red-500")).toBeTruthy();
  });

  it("shows quorum met with green styling context", () => {
    render(<QuorumProgressBar votesCast={120_000} quorumRequired={100_000} />);
    expect(screen.getByText(/Quorum: 120\.0K \/ 100\.0K required \(100%\)/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar.querySelector(".bg-emerald-500")).toBeTruthy();
  });

  it("updates label when votes change", () => {
    const { rerender } = render(
      <QuorumProgressBar votesCast={50_000} quorumRequired={100_000} />,
    );
    expect(screen.getByText(/50\.0K \/ 100\.0K/)).toBeInTheDocument();

    rerender(<QuorumProgressBar votesCast={80_000} quorumRequired={100_000} />);
    expect(screen.getByText(/80\.0K \/ 100\.0K/)).toBeInTheDocument();
  });
});
