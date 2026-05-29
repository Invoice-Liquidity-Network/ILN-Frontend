import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import type { Invoice } from "@/utils/soroban";
import {
  calculateYield,
  formatAddress,
  formatTokenAmount,
  type TokenDisplayMeta,
} from "@/utils/format";

export interface LPEarningsRow {
  invoiceId: string;
  payer: string;
  settlementTimestamp: bigint;
  settlementDate: string;
  amountFunded: string;
  payoutReceived: string;
  earned: string;
  token: string;
  yieldPercent: string;
}

function getTokenForInvoice(
  invoice: Invoice,
  tokenMap: Map<string, ApprovedToken>,
  defaultToken: ApprovedToken | null,
): TokenDisplayMeta {
  return (
    tokenMap.get(invoice.token ?? defaultToken?.contractId ?? "") ??
    defaultToken ?? {
      symbol: "USDC",
      decimals: 7,
    }
  );
}

function formatIsoDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
}

export function buildLPEarningsRows(
  invoices: Invoice[],
  tokenMap = new Map<string, ApprovedToken>(),
  defaultToken: ApprovedToken | null = null,
): LPEarningsRow[] {
  return invoices
    .filter((invoice) => invoice.status === "Paid")
    .map((invoice) => {
      const token = getTokenForInvoice(invoice, tokenMap, defaultToken);
      const earned = calculateYield(invoice.amount, invoice.discount_rate);
      const payoutReceived = invoice.amount;
      const amountFunded = invoice.amount - earned;
      const settlementTimestamp = invoice.funded_at ?? invoice.due_date;

      return {
        invoiceId: invoice.id.toString(),
        payer: invoice.payer,
        settlementTimestamp,
        settlementDate: formatIsoDate(settlementTimestamp),
        amountFunded: formatTokenAmount(amountFunded, token),
        payoutReceived: formatTokenAmount(payoutReceived, token),
        earned: formatTokenAmount(earned, token),
        token: token.symbol,
        yieldPercent: `${(invoice.discount_rate / 100).toFixed(2)}%`,
      };
    })
    .sort((a, b) => Number(b.settlementTimestamp - a.settlementTimestamp));
}

export function buildLPEarningsCsv(rows: LPEarningsRow[]): string {
  const headers = [
    "Invoice ID",
    "Payer",
    "Settlement Date",
    "Amount Funded",
    "Payout Received",
    "Earned",
    "Token",
    "Yield %",
  ];

  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const body = rows.map((row) =>
    [
      row.invoiceId,
      row.payer,
      row.settlementDate,
      row.amountFunded,
      row.payoutReceived,
      row.earned,
      row.token,
      row.yieldPercent,
    ].map(escapeCell).join(","),
  );

  return [headers.join(","), ...body].join("\n");
}

export function getLPEarningsExportFilename(date = new Date()): string {
  return `ILN-LP-Earnings-${date.toISOString().slice(0, 10)}.csv`;
}

export function formatEarningsPayer(address: string): string {
  return formatAddress(address);
}
