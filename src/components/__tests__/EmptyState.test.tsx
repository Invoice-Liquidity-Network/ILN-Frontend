import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders wallet-disconnected message", () => {
    render(<EmptyState variant="wallet-disconnected" />);
    expect(screen.getByText("Connect your wallet to view your invoices")).toBeDefined();
  });

  it("renders no-invoices message with illustration", () => {
    render(<EmptyState variant="no-invoices" />);
    expect(screen.getByText("No invoices found")).toBeDefined();
  });

  it("renders no-funded-positions message", () => {
    render(<EmptyState variant="no-funded-positions" />);
    expect(screen.getByText("You have no funded positions yet")).toBeDefined();
  });

  it("renders empty-marketplace message", () => {
    render(<EmptyState variant="empty-marketplace" />);
    expect(screen.getByText("No invoices available in the marketplace")).toBeDefined();
  });

  it("renders no-governance-proposals message", () => {
    render(<EmptyState variant="no-governance-proposals" />);
    expect(screen.getByText("No governance proposals at this time")).toBeDefined();
  });

  it("renders action button when action prop is provided", () => {
    const onClick = vi.fn();
    render(<EmptyState variant="no-invoices" action={{ label: "Create Invoice", onClick }} />);
    const btn = screen.getByRole("button", { name: "Create Invoice" });
    expect(btn).toBeDefined();
  });

  it("calls action.onClick when button is clicked", () => {
    const onClick = vi.fn();
    render(<EmptyState variant="no-invoices" action={{ label: "Create Invoice", onClick }} />);
    fireEvent.click(screen.getByRole("button", { name: "Create Invoice" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders no button when action prop is omitted", () => {
    render(<EmptyState variant="no-invoices" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
