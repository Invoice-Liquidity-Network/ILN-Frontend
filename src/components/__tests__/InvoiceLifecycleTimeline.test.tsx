import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InvoiceLifecycleTimeline from "../InvoiceLifecycleTimeline";

describe("InvoiceLifecycleTimeline (#12)", () => {
  it("renders the three happy-path steps", () => {
    render(<InvoiceLifecycleTimeline status="Pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Funded")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("marks the current step for an in-progress invoice", () => {
    render(<InvoiceLifecycleTimeline status="Funded" />);
    const current = screen.getByText("Funded").closest("li");
    expect(current?.querySelector('[aria-current="step"]')).not.toBeNull();
    // Pending precedes Funded, so it is completed (rendered as a checkmark).
    const pending = screen.getByText("Pending").closest("li");
    expect(pending?.textContent).toContain("✓");
  });

  it("shows every prior step completed once Paid", () => {
    render(<InvoiceLifecycleTimeline status="Paid" />);
    const pending = screen.getByText("Pending").closest("li");
    const funded = screen.getByText("Funded").closest("li");
    expect(pending?.textContent).toContain("✓");
    expect(funded?.textContent).toContain("✓");
    // Paid is the current (final) step.
    const paid = screen.getByText("Paid").closest("li");
    expect(paid?.querySelector('[aria-current="step"]')).not.toBeNull();
  });

  it("replaces the final step with a terminal state for Cancelled invoices", () => {
    render(<InvoiceLifecycleTimeline status="Cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("surfaces Defaulted as a terminal state", () => {
    render(<InvoiceLifecycleTimeline status="Defaulted" />);
    expect(screen.getByText("Defaulted")).toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });
});
