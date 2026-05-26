import { fireEvent, render, screen } from "@testing-library/react";
import RiskBadge from "../RiskBadge";

describe("RiskBadge reputation score tooltip", () => {
  it("shows the score formula and sub-metrics when opened", () => {
    render(<RiskBadge risk="Low" score={{ score: 80, settled_on_time: 8, defaults: 2 }} />);

    fireEvent.click(screen.getByRole("button", { name: /show reputation score details/i }));

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Score = (Invoices Paid / Invoices Submitted) x 100. Adjusted for inactivity decay.");
    expect(tooltip).toHaveTextContent("Paid invoices");
    expect(tooltip).toHaveTextContent("8");
    expect(tooltip).toHaveTextContent("Defaulted invoices");
    expect(tooltip).toHaveTextContent("2");
    expect(tooltip).toHaveTextContent("Submitted invoices");
    expect(tooltip).toHaveTextContent("10");
  });

  it("opens on keyboard focus and closes with Escape", () => {
    render(<RiskBadge risk="Medium" score={{ score: 50, settled_on_time: 3, defaults: 3 }} />);

    const trigger = screen.getByRole("button", { name: /show reputation score details/i });
    fireEvent.focus(trigger);

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(trigger, { key: "Escape" });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
