import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QuorumProgressBar from "../QuorumProgressBar";

describe("QuorumProgressBar", () => {
  it("shows red quorum progress when the threshold is not met", () => {
    render(<QuorumProgressBar totalVotes={75_000} totalSupply={1_000_000} quorumBps={1000} />);

    expect(screen.getByText("Quorum: 75.0K / 100.0K required")).toBeInTheDocument();
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /quorum progress/i })).toHaveAttribute(
      "aria-valuenow",
      "75000",
    );
  });

  it("shows green capped progress when quorum is met", () => {
    render(<QuorumProgressBar totalVotes={125_000} totalSupply={1_000_000} quorumBps={1000} />);

    expect(screen.getByText("Quorum: 125.0K / 100.0K required")).toBeInTheDocument();
    expect(screen.getByText("100.0%")).toBeInTheDocument();
    expect(screen.getByText("check_circle")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /quorum progress/i })).toHaveAttribute(
      "aria-valuenow",
      "100000",
    );
  });

  it("handles an empty quorum threshold without dividing by zero", () => {
    render(<QuorumProgressBar totalVotes={0} totalSupply={0} quorumBps={1000} />);

    expect(screen.getByText("Quorum: 0 / 0 required")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });
});
