import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExpiryCountdown from "../ExpiryCountdown";

describe("ExpiryCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function dueDateAfter(seconds: number) {
    return BigInt(Math.floor(Date.now() / 1000) + seconds);
  }

  it("uses green styling for invoices more than seven days away", () => {
    render(<ExpiryCountdown dueDate={dueDateAfter(10 * 24 * 60 * 60)} />);

    const badge = screen.getByLabelText("Invoice expires in 10d 0h");
    expect(badge).toHaveTextContent("Expires in 10d 0h");
    expect(badge.className).toContain("text-green-600");
  });

  it("uses amber styling for invoices one to seven days away", () => {
    render(<ExpiryCountdown dueDate={dueDateAfter(3 * 24 * 60 * 60 + 14 * 60 * 60)} />);

    const badge = screen.getByLabelText("Invoice expires in 3d 14h");
    expect(badge).toHaveTextContent("Expires in 3d 14h");
    expect(badge.className).toContain("text-amber-600");
  });

  it("uses red styling for invoices under 24 hours away", () => {
    render(<ExpiryCountdown dueDate={dueDateAfter(14 * 60 * 60)} />);

    const badge = screen.getByLabelText("Invoice expires in 14h 0m");
    expect(badge).toHaveTextContent("Expires in 14h 0m");
    expect(badge.className).toContain("text-red-600");
  });

  it("shows a grey expired badge after the due date", () => {
    render(<ExpiryCountdown dueDate={dueDateAfter(-60)} />);

    const badge = screen.getByLabelText("Invoice expired");
    expect(badge).toHaveTextContent("Expired");
    expect(badge.className).toContain("text-on-surface-variant");
  });

  it("updates every minute without a refresh", () => {
    render(<ExpiryCountdown dueDate={dueDateAfter(2 * 60 * 60)} />);

    expect(screen.getByLabelText("Invoice expires in 2h 0m")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByLabelText("Invoice expires in 1h 59m")).toBeInTheDocument();
  });
});

