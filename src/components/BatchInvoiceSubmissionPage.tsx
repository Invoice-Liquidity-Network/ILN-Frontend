"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TokenSelector, { TokenAmount } from "@/components/TokenSelector";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useToast } from "@/context/ToastContext";
import { useWallet } from "@/context/WalletContext";
import {
  createBatchInvoiceDraft,
  MAX_BATCH_INVOICE_ROWS,
  parseBatchInvoiceCsv,
  summarizeBatchInvoices,
  validateBatchInvoiceRows,
  type BatchInvoiceDraft,
  type BatchInvoiceErrors,
  type PreparedBatchInvoice,
} from "@/utils/batchInvoiceSubmission";
import { formatAmountFromUnits, getMinimumDueDate } from "@/utils/invoiceSubmission";
import { NETWORK_NAME } from "@/constants";
import { submitBatchInvoicesTransaction } from "@/utils/soroban";

type BatchInputMode = "csv" | "form";

interface BatchResultRow {
  rowNumber: number;
  payer: string;
  status: "success" | "failed";
  message: string;
}

const INITIAL_ROWS = [createBatchInvoiceDraft(0)];

export default function BatchInvoiceSubmissionPage() {
  const { address, isConnected, connect, signTx, networkMismatch } = useWallet();
  const { addToast, updateToast } = useToast();
  const { tokens, defaultToken, isLoading: tokensLoading } = useApprovedTokens();
  const [mode, setMode] = useState<BatchInputMode>("csv");
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<BatchInvoiceDraft[]>(INITIAL_ROWS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultRows, setResultRows] = useState<BatchResultRow[]>([]);
  const minimumDueDate = getMinimumDueDate();

  const effectiveRows = mode === "csv" ? parseBatchInvoiceCsv(csvText) : rows;
  const validatedRows = useMemo(
    () => validateBatchInvoiceRows(effectiveRows, tokens),
    [effectiveRows, tokens],
  );
  const summary = useMemo(
    () => summarizeBatchInvoices(validatedRows, tokens),
    [tokens, validatedRows],
  );
  const validPreparedRows = validatedRows
    .map((row) => row.prepared)
    .filter((row): row is PreparedBatchInvoice => Boolean(row));
  const hasValidationErrors = validatedRows.some((row) => Object.keys(row.errors).length > 0);
  const canSubmit =
    isConnected &&
    !networkMismatch &&
    validPreparedRows.length > 0 &&
    !hasValidationErrors &&
    validPreparedRows.length <= MAX_BATCH_INVOICE_ROWS &&
    !isSubmitting;

  const updateRow = (rowId: string, field: keyof Omit<BatchInvoiceDraft, "id">, value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
    setResultRows([]);
  };

  const addRow = () => {
    setRows((current) =>
      current.length >= MAX_BATCH_INVOICE_ROWS
        ? current
        : [...current, createBatchInvoiceDraft(current.length)]
    );
  };

  const removeRow = (rowId: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== rowId)));
  };

  const handleCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvText(await file.text());
    setResultRows([]);
  };

  const handleSubmit = async () => {
    if (!address) {
      await connect();
      return;
    }

    if (!canSubmit) return;

    setIsSubmitting(true);
    setResultRows([]);
    const toastId = addToast({
      type: "pending",
      title: "Submitting invoice batch...",
      message: "Please sign one atomic batch transaction in Freighter.",
    });

    try {
      const result = await submitBatchInvoicesTransaction({
        freelancer: address,
        invoices: validPreparedRows,
        signTx,
      });

      setResultRows(
        validPreparedRows.map((row, index) => ({
          rowNumber: index + 1,
          payer: row.payer,
          status: "success",
          message: `Included in transaction ${result.txHash.slice(0, 10)}...`,
        }))
      );
      updateToast(toastId, {
        type: "success",
        title: "Batch submitted",
        message: `${validPreparedRows.length} invoices were submitted atomically.`,
        txHash: result.txHash,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Batch submission failed.";
      setResultRows(
        validPreparedRows.map((row, index) => ({
          rowNumber: index + 1,
          payer: row.payer,
          status: "failed",
          message,
        }))
      );
      updateToast(toastId, {
        type: "error",
        title: "Batch failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="px-4 pb-16 pt-28 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
                Freelancer Portal
              </p>
              <h1 className="mt-2 font-headline text-3xl sm:text-4xl">Batch invoice submission</h1>
            </div>
            {!isConnected ? (
              <button
                type="button"
                onClick={connect}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg hover:bg-primary/90"
              >
                Connect Freighter
              </button>
            ) : (
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm">
                <span className="text-on-surface-variant">Wallet </span>
                <span className="font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
              </div>
            )}
          </div>

          {networkMismatch && (
            <div className="mb-6 rounded-2xl border border-error/20 bg-error-container/70 px-5 py-4 text-sm font-semibold text-on-error-container">
              Switch Freighter to {NETWORK_NAME} before submitting this batch.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <div className="flex w-fit rounded-xl bg-surface-container-low p-1">
                <button
                  type="button"
                  onClick={() => setMode("csv")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    mode === "csv" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  CSV Upload
                </button>
                <button
                  type="button"
                  onClick={() => setMode("form")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    mode === "form" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  Multi-row Form
                </button>
              </div>

              {mode === "csv" ? (
                <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-lg">
                  <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
                    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low p-5 text-center">
                      <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
                      <span className="mt-2 text-sm font-bold">Upload CSV</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleCsvUpload}
                        className="sr-only"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                        CSV rows
                      </span>
                      <textarea
                        value={csvText}
                        onChange={(event) => {
                          setCsvText(event.target.value);
                          setResultRows([]);
                        }}
                        className="mt-2 min-h-40 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-mono text-sm outline-none focus:border-primary"
                        placeholder="payer,amount,token,discount_rate,due_date"
                      />
                    </label>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold">Invoices</h2>
                    <button
                      type="button"
                      onClick={addRow}
                      disabled={rows.length >= MAX_BATCH_INVOICE_ROWS}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
                    >
                      + Add Row
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {rows.map((row, index) => (
                      <BatchFormRow
                        key={row.id}
                        row={row}
                        index={index}
                        errors={validatedRows[index]?.errors ?? {}}
                        tokenOptions={tokens}
                        defaultTokenId={defaultToken?.contractId ?? ""}
                        minimumDueDate={minimumDueDate}
                        onUpdate={updateRow}
                        onRemove={removeRow}
                        canRemove={rows.length > 1}
                      />
                    ))}
                  </div>
                </section>
              )}

              <BatchPreviewTable rows={validatedRows} tokensLoading={tokensLoading} />

              {resultRows.length > 0 && (
                <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-lg">
                  <h2 className="text-lg font-bold">Batch result</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Payer</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultRows.map((row) => (
                          <tr key={row.rowNumber} className="border-t border-outline-variant/10">
                            <td className="px-3 py-3 font-bold">{row.rowNumber}</td>
                            <td className="px-3 py-3 font-mono text-xs">{row.payer}</td>
                            <td className="px-3 py-3">
                              <span className={row.status === "success" ? "text-emerald-500" : "text-error"}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">{row.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Preview Summary
              </p>
              <div className="mt-4 space-y-3">
                <SummaryRow label="Total invoices" value={`${summary.totalInvoices} / ${MAX_BATCH_INVOICE_ROWS}`} />
                <SummaryRow label="Valid rows" value={`${validPreparedRows.length}`} />
                <SummaryRow label="Estimated fees" value={summary.estimatedFeesXlm} />
              </div>
              <div className="mt-5 border-t border-outline-variant/10 pt-4">
                <p className="text-sm font-bold">Total amount</p>
                {summary.totalByToken.length === 0 ? (
                  <p className="mt-2 text-sm text-on-surface-variant">No valid invoice amounts yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {summary.totalByToken.map((item) => (
                      <TokenAmount key={item.token.contractId} amount={item.formatted} token={item.token} />
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="mt-6 w-full rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-on-primary shadow-lg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Batch"}
              </button>
              {hasValidationErrors && (
                <p className="mt-3 text-sm text-error">Fix inline validation errors before submitting.</p>
              )}
            </aside>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function BatchFormRow({
  row,
  index,
  errors,
  tokenOptions,
  defaultTokenId,
  minimumDueDate,
  onUpdate,
  onRemove,
  canRemove,
}: {
  row: BatchInvoiceDraft;
  index: number;
  errors: BatchInvoiceErrors;
  tokenOptions: ReturnType<typeof useApprovedTokens>["tokens"];
  defaultTokenId: string;
  minimumDueDate: string;
  onUpdate: (rowId: string, field: keyof Omit<BatchInvoiceDraft, "id">, value: string) => void;
  onRemove: (rowId: string) => void;
  canRemove: boolean;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">Row {index + 1}</p>
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          disabled={!canRemove}
          className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
          aria-label={`Remove row ${index + 1}`}
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <BatchInput
          label="Payer"
          value={row.payer}
          error={errors.payer}
          onChange={(value) => onUpdate(row.id, "payer", value)}
          className="md:col-span-2"
        />
        <BatchInput
          label="Amount"
          value={row.amount}
          error={errors.amount}
          onChange={(value) => onUpdate(row.id, "amount", value)}
          inputMode="decimal"
        />
        <TokenSelector
          label="Token"
          value={row.token || defaultTokenId}
          tokens={tokenOptions}
          error={errors.token}
          onChange={(value) => onUpdate(row.id, "token", value)}
        />
        <BatchInput
          label="Discount"
          value={row.discountRate}
          error={errors.discount_rate}
          onChange={(value) => onUpdate(row.id, "discountRate", value)}
          inputMode="decimal"
        />
        <BatchInput
          label="Due date"
          type="date"
          value={row.dueDate}
          error={errors.due_date}
          onChange={(value) => onUpdate(row.id, "dueDate", value)}
          min={minimumDueDate}
        />
      </div>
    </div>
  );
}

function BatchInput({
  label,
  value,
  error,
  onChange,
  type = "text",
  inputMode,
  min,
  className = "",
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "decimal";
  min?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        inputMode={inputMode}
        min={min}
        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-primary ${
          error ? "border-error bg-error-container/30" : "border-outline-variant/20 bg-surface-container-lowest"
        }`}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </label>
  );
}

function BatchPreviewTable({
  rows,
  tokensLoading,
}: {
  rows: ReturnType<typeof validateBatchInvoiceRows>;
  tokensLoading: boolean;
}) {
  if (tokensLoading) {
    return (
      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-lg">
        Loading approved tokens...
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-lg">
      <h2 className="text-lg font-bold">Preview</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Payer</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Discount</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-on-surface-variant">
                  Add or upload invoice rows to preview the batch.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const errors = Object.values(row.errors);
                return (
                  <tr
                    key={row.draft.id}
                    className={`border-t border-outline-variant/10 ${
                      errors.length > 0 ? "bg-error-container/20" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-bold">{index + 1}</td>
                    <td className="px-3 py-3 font-mono text-xs">{row.draft.payer || "-"}</td>
                    <td className="px-3 py-3">
                      {row.prepared ? formatAmountFromUnits(row.prepared.amount) : row.draft.amount || "-"}
                    </td>
                    <td className="px-3 py-3">{row.draft.discountRate || "-"}%</td>
                    <td className="px-3 py-3">{row.draft.dueDate || "-"}</td>
                    <td className="px-3 py-3">
                      {errors.length === 0 ? (
                        <span className="text-emerald-500">Ready</span>
                      ) : (
                        <ul className="space-y-1 text-xs text-error">
                          {errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
