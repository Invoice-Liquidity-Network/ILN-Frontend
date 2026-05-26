import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShareInvoiceButton from "../ShareInvoiceButton";

describe("ShareInvoiceButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://iln.example" },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("copies the canonical invoice link and shows confirmation", async () => {
    render(<ShareInvoiceButton invoiceId={23n} />);

    fireEvent.click(screen.getByRole("button", { name: /share invoice/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://iln.example/invoices/23",
      );
      expect(screen.getByRole("status")).toHaveTextContent("Link copied!");
    });
  });

  it("renders a mailto link with the canonical invoice URL", () => {
    render(<ShareInvoiceButton invoiceId={23n} />);

    const link = screen.getByRole("link", { name: /share via email/i });

    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain(
      "https://iln.example/invoices/23",
    );
  });
});
