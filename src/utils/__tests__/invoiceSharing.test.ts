import { describe, expect, it } from "vitest";
import { buildInvoiceCanonicalUrl, buildInvoiceMailtoUrl } from "../invoiceSharing";

describe("invoiceSharing", () => {
  it("builds canonical invoice URLs under /invoices/[id]", () => {
    expect(buildInvoiceCanonicalUrl(42n, "https://iln.example/")).toBe(
      "https://iln.example/invoices/42",
    );
  });

  it("builds a prefilled mailto URL with the invoice link", () => {
    const mailto = buildInvoiceMailtoUrl(42n, "https://iln.example/invoices/42");

    expect(mailto).toContain("mailto:?");
    expect(decodeURIComponent(mailto)).toContain("Invoice #42 for review");
    expect(decodeURIComponent(mailto)).toContain("https://iln.example/invoices/42");
  });
});
