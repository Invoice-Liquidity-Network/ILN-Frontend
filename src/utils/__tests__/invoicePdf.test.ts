import { describe, expect, it } from "vitest";
import { TESTNET_EURC_TOKEN_ID } from "@/constants";
import {
  getInvoicePageUrl,
  getInvoicePdfFilename,
  getInvoicePdfRows,
} from "@/utils/invoicePdf";
import type { Invoice } from "@/utils/soroban";

const invoice: Invoice = {
  id: 42n,
  freelancer: "GFREELANCERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  payer: "GPAYERBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  amount: 125_500_000n,
  due_date: 1_900_000_000n,
  discount_rate: 275,
  status: "Funded",
  token: TESTNET_EURC_TOKEN_ID,
};

describe("invoice PDF helpers", () => {
  it("uses the required ILN invoice PDF filename", () => {
    expect(getInvoicePdfFilename(42n)).toBe("ILN-Invoice-42.pdf");
  });

  it("builds the shareable invoice page URL", () => {
    expect(getInvoicePageUrl(42n, "https://iln.example/")).toBe("https://iln.example/pay/42");
  });

  it("serializes all required PDF fields", () => {
    expect(getInvoicePdfRows(invoice)).toMatchInlineSnapshot(`
      [
        {
          "label": "Invoice ID",
          "value": "#42",
        },
        {
          "label": "Submitter address",
          "value": "GFREELANCERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
        {
          "label": "Payer address",
          "value": "GPAYERBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        },
        {
          "label": "Amount",
          "value": "12.55 EURC",
        },
        {
          "label": "Token",
          "value": "EURC",
        },
        {
          "label": "Discount rate",
          "value": "275 bps / 2.75%",
        },
        {
          "label": "Due date",
          "value": "March 17, 2030",
        },
        {
          "label": "Current status",
          "value": "Funded",
        },
      ]
    `);
  });
});
