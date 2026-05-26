import {
  formatAmountFromUnits,
  isValidStellarAccount,
  parseAmountToUnits,
  parseDiscountRateToBps,
  toUnixTimestamp,
} from "@/utils/invoiceSubmission";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";

export const MAX_BATCH_INVOICE_ROWS = 50;
export const BATCH_INVOICE_COLUMNS = ["payer", "amount", "token", "discount_rate", "due_date"] as const;

export type BatchInvoiceColumn = (typeof BATCH_INVOICE_COLUMNS)[number];

export interface BatchInvoiceDraft {
  id: string;
  payer: string;
  amount: string;
  token: string;
  discountRate: string;
  dueDate: string;
}

export interface PreparedBatchInvoice {
  payer: string;
  amount: bigint;
  token: string;
  discountRate: number;
  dueDate: number;
}

export type BatchInvoiceErrors = Partial<Record<BatchInvoiceColumn, string>>;

export interface ValidatedBatchInvoiceRow {
  draft: BatchInvoiceDraft;
  errors: BatchInvoiceErrors;
  prepared: PreparedBatchInvoice | null;
}

export interface BatchInvoiceSummary {
  totalInvoices: number;
  totalByToken: Array<{ token: ApprovedToken; amount: bigint; formatted: string }>;
  estimatedFeesXlm: string;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"" && inQuotes && nextChar === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export function createBatchInvoiceDraft(index: number): BatchInvoiceDraft {
  return {
    id: `row-${index}`,
    payer: "",
    amount: "",
    token: "",
    discountRate: "3.00",
    dueDate: "",
  };
}

export function parseBatchInvoiceCsv(csv: string): BatchInvoiceDraft[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const columnIndexes = Object.fromEntries(
    BATCH_INVOICE_COLUMNS.map((column) => [column, headers.indexOf(column)])
  ) as Record<BatchInvoiceColumn, number>;

  return lines.slice(1, MAX_BATCH_INVOICE_ROWS + 1).map((line, index) => {
    const values = parseCsvLine(line);
    return {
      id: `csv-${index}`,
      payer: values[columnIndexes.payer] ?? "",
      amount: values[columnIndexes.amount] ?? "",
      token: values[columnIndexes.token] ?? "",
      discountRate: values[columnIndexes.discount_rate] ?? "",
      dueDate: values[columnIndexes.due_date] ?? "",
    };
  });
}

export function findBatchToken(value: string, tokens: ApprovedToken[]): ApprovedToken | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return (
    tokens.find((token) => token.contractId.toLowerCase() === normalized) ??
    tokens.find((token) => token.symbol.toLowerCase() === normalized) ??
    null
  );
}

export function validateBatchInvoiceRows(
  drafts: BatchInvoiceDraft[],
  tokens: ApprovedToken[],
  nowInSeconds = Math.floor(Date.now() / 1000),
): ValidatedBatchInvoiceRow[] {
  return drafts.slice(0, MAX_BATCH_INVOICE_ROWS).map((draft) => {
    const errors: BatchInvoiceErrors = {};
    const token = findBatchToken(draft.token, tokens);
    const decimals = token?.decimals ?? 7;
    const amount = parseAmountToUnits(draft.amount, decimals);
    const discountRate = parseDiscountRateToBps(draft.discountRate);
    const dueDate = toUnixTimestamp(draft.dueDate);

    if (!draft.payer.trim()) {
      errors.payer = "Payer address is required.";
    } else if (!isValidStellarAccount(draft.payer)) {
      errors.payer = "Enter a valid Stellar G-address.";
    }

    if (amount === null || amount <= 0n) {
      errors.amount = `Enter a valid ${token?.symbol ?? "token"} amount.`;
    }

    if (!token) {
      errors.token = "Select an approved token by symbol or contract ID.";
    }

    if (discountRate === null) {
      errors.discount_rate = "Discount rate must be between 0.01% and 50%.";
    }

    if (dueDate === null) {
      errors.due_date = "Select a valid due date.";
    } else if (dueDate <= nowInSeconds) {
      errors.due_date = "Due date must be in the future.";
    }

    return {
      draft,
      errors,
      prepared:
        Object.keys(errors).length === 0 && token && amount !== null && discountRate !== null && dueDate !== null
          ? {
              payer: draft.payer.trim(),
              amount,
              token: token.contractId,
              discountRate,
              dueDate,
            }
          : null,
    };
  });
}

export function summarizeBatchInvoices(
  rows: ValidatedBatchInvoiceRow[],
  tokens: ApprovedToken[],
): BatchInvoiceSummary {
  const totals = new Map<string, bigint>();
  const preparedRows = rows.filter((row) => row.prepared);

  for (const row of preparedRows) {
    const prepared = row.prepared!;
    totals.set(prepared.token, (totals.get(prepared.token) ?? 0n) + prepared.amount);
  }

  return {
    totalInvoices: rows.length,
    totalByToken: [...totals.entries()].map(([tokenId, amount]) => {
      const token = tokens.find((item) => item.contractId === tokenId)!;
      return {
        token,
        amount,
        formatted: `${formatAmountFromUnits(amount, token.decimals)} ${token.symbol}`,
      };
    }),
    estimatedFeesXlm: `${(preparedRows.length * 0.00001).toFixed(5)} XLM`,
  };
}
