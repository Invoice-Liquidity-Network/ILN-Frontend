import { describe, expect, it } from "vitest";
import {
  parseBatchInvoiceCsv,
  summarizeBatchInvoices,
  validateBatchInvoiceRows,
} from "../batchInvoiceSubmission";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";

const TOKENS: ApprovedToken[] = [
  {
    contractId: "GCSXPYZSTPKX2GDVW6XSJDBE3PVSNSXCCLTGSPJXNF57IJU5EDU6IUDV",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 7,
    iconLabel: "US",
  },
  {
    contractId: "GDIEC472DEK3S5UWVKYDBXG74R53KMHGXGFIURLJUF6P6JJ352HLLJED",
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 7,
    iconLabel: "EU",
  },
];

const PAYER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const FUTURE_NOW = 1_700_000_000;

describe("batchInvoiceSubmission", () => {
  it("parses CSV rows with required invoice columns", () => {
    const rows = parseBatchInvoiceCsv(
      `payer,amount,token,discount_rate,due_date\n${PAYER},125.50,USDC,3.25,2030-01-01`,
    );

    expect(rows).toEqual([
      {
        id: "csv-0",
        payer: PAYER,
        amount: "125.50",
        token: "USDC",
        discountRate: "3.25",
        dueDate: "2030-01-01",
      },
    ]);
  });

  it("validates rows and prepares contract-ready values", () => {
    const [row] = validateBatchInvoiceRows(
      [
        {
          id: "row-1",
          payer: PAYER,
          amount: "12.345",
          token: "USDC",
          discountRate: "2.50",
          dueDate: "2030-01-01",
        },
      ],
      TOKENS,
      FUTURE_NOW,
    );

    expect(row.errors).toEqual({});
    expect(row.prepared).toMatchObject({
      payer: PAYER,
      amount: 123_450_000n,
      token: TOKENS[0].contractId,
      discountRate: 250,
    });
    expect(row.prepared?.dueDate).toBeGreaterThan(FUTURE_NOW);
  });

  it("highlights inline validation errors", () => {
    const [row] = validateBatchInvoiceRows(
      [
        {
          id: "row-1",
          payer: "not-a-key",
          amount: "0",
          token: "DOGE",
          discountRate: "75",
          dueDate: "2020-01-01",
        },
      ],
      TOKENS,
      FUTURE_NOW,
    );

    expect(row.prepared).toBeNull();
    expect(row.errors).toEqual({
      payer: "Enter a valid Stellar G-address.",
      amount: "Enter a valid token amount.",
      token: "Select an approved token by symbol or contract ID.",
      discount_rate: "Discount rate must be between 0.01% and 50%.",
      due_date: "Due date must be in the future.",
    });
  });

  it("summarizes total invoices, token totals, and estimated fees", () => {
    const rows = validateBatchInvoiceRows(
      [
        {
          id: "row-1",
          payer: PAYER,
          amount: "10",
          token: "USDC",
          discountRate: "2",
          dueDate: "2030-01-01",
        },
        {
          id: "row-2",
          payer: PAYER,
          amount: "5",
          token: "USDC",
          discountRate: "3",
          dueDate: "2030-02-01",
        },
      ],
      TOKENS,
      FUTURE_NOW,
    );

    expect(summarizeBatchInvoices(rows, TOKENS)).toMatchObject({
      totalInvoices: 2,
      estimatedFeesXlm: "0.00002 XLM",
      totalByToken: [
        {
          amount: 150_000_000n,
          formatted: "15 USDC",
        },
      ],
    });
  });
});
