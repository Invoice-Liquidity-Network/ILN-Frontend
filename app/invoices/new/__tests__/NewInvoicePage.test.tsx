import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewInvoicePage from "../page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <nav>Navbar</nav>,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("@/components/SubmitInvoiceForm", () => ({
  default: ({ onSubmitted }: { onSubmitted?: (invoiceId: string) => void }) => (
    <button type="button" onClick={() => onSubmitted?.("42")}>
      Mock submit invoice
    </button>
  ),
}));

describe("NewInvoicePage", () => {
  it("redirects successful submissions to the invoice detail page", () => {
    render(<NewInvoicePage />);

    screen.getByRole("button", { name: "Mock submit invoice" }).click();

    expect(push).toHaveBeenCalledWith("/invoices/42");
  });
});
