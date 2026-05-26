import { TESTNET_EURC_TOKEN_ID, TESTNET_USDC_TOKEN_ID } from "@/constants";
import { formatTokenAmount } from "@/utils/format";
import type { Invoice } from "@/utils/soroban";

export interface InvoicePdfRow {
  label: string;
  value: string;
}

const TOKEN_META_BY_ID: Record<string, { symbol: string; decimals: number }> = {
  [TESTNET_USDC_TOKEN_ID]: { symbol: "USDC", decimals: 7 },
  [TESTNET_EURC_TOKEN_ID]: { symbol: "EURC", decimals: 7 },
};

export function getInvoicePdfFilename(invoiceId: bigint): string {
  return `ILN-Invoice-${invoiceId.toString()}.pdf`;
}

export function getInvoicePageUrl(invoiceId: bigint, origin: string): string {
  return `${origin.replace(/\/$/, "")}/pay/${invoiceId.toString()}`;
}

export function getInvoiceTokenMeta(invoice: Invoice): { symbol: string; decimals: number } {
  return invoice.token ? TOKEN_META_BY_ID[invoice.token] ?? { symbol: "TOKEN", decimals: 7 } : { symbol: "USDC", decimals: 7 };
}

export function getInvoicePdfRows(invoice: Invoice): InvoicePdfRow[] {
  const token = getInvoiceTokenMeta(invoice);

  return [
    { label: "Invoice ID", value: `#${invoice.id.toString()}` },
    { label: "Submitter address", value: invoice.freelancer },
    { label: "Payer address", value: invoice.payer },
    { label: "Amount", value: formatTokenAmount(invoice.amount, token) },
    { label: "Token", value: token.symbol },
    { label: "Discount rate", value: `${invoice.discount_rate} bps / ${(invoice.discount_rate / 100).toFixed(2)}%` },
    { label: "Due date", value: new Date(Number(invoice.due_date) * 1000).toLocaleDateString(undefined, { dateStyle: "long" }) },
    { label: "Current status", value: invoice.status },
  ];
}
