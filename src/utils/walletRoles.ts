import type { Invoice } from "./soroban";

export type WalletRole = "freelancer" | "payer" | "lp";

export interface WalletRoleSummary {
  roles: WalletRole[];
  submittedCount: number;
  payerCount: number;
  fundedCount: number;
}

export function deriveWalletRoles(address: string, invoices: Invoice[]): WalletRoleSummary {
  const submittedCount = invoices.filter((invoice) => invoice.freelancer === address).length;
  const payerCount = invoices.filter((invoice) => invoice.payer === address).length;
  const fundedCount = invoices.filter((invoice) => invoice.funder === address).length;
  const roles: WalletRole[] = [];

  if (submittedCount > 0) roles.push("freelancer");
  if (payerCount > 0) roles.push("payer");
  if (fundedCount > 0) roles.push("lp");

  return {
    roles,
    submittedCount,
    payerCount,
    fundedCount,
  };
}

