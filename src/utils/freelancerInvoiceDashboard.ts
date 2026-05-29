import type { Invoice } from "@/utils/soroban";

export const FREELANCER_INVOICE_STATUSES = [
  "All",
  "Pending",
  "Funded",
  "Paid",
  "Cancelled",
  "Expired",
  "Disputed",
] as const;

export type FreelancerInvoiceStatusFilter = (typeof FREELANCER_INVOICE_STATUSES)[number];
export type FreelancerInvoiceSortKey = "due_date" | "amount" | "status";
export type SortDirection = "asc" | "desc";

interface DashboardOptions {
  invoices: Invoice[];
  submitterAddress: string | null | undefined;
  statusFilter: FreelancerInvoiceStatusFilter;
  sortKey: FreelancerInvoiceSortKey;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

export interface DashboardInvoiceResult {
  items: Invoice[];
  total: number;
  page: number;
  pageCount: number;
}

const STATUS_ORDER = new Map([
  ["Pending", 0],
  ["Funded", 1],
  ["Paid", 2],
  ["Cancelled", 3],
  ["Expired", 4],
  ["Disputed", 5],
]);

function compareStatus(left: string, right: string): number {
  const leftRank = STATUS_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER;
  const rightRank = STATUS_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER;
  return leftRank === rightRank ? left.localeCompare(right) : leftRank - rightRank;
}

export function buildFreelancerInvoiceDashboard({
  invoices,
  submitterAddress,
  statusFilter,
  sortKey,
  sortDirection,
  page,
  pageSize,
}: DashboardOptions): DashboardInvoiceResult {
  const normalizedSubmitter = submitterAddress?.toLowerCase();
  const direction = sortDirection === "asc" ? 1 : -1;

  const filtered = invoices
    .filter((invoice) => !normalizedSubmitter || invoice.freelancer.toLowerCase() === normalizedSubmitter)
    .filter((invoice) => statusFilter === "All" || invoice.status === statusFilter)
    .sort((left, right) => {
      if (sortKey === "amount") {
        return left.amount === right.amount ? 0 : left.amount > right.amount ? direction : -direction;
      }

      if (sortKey === "status") {
        return compareStatus(left.status, right.status) * direction;
      }

      return left.due_date === right.due_date ? 0 : left.due_date > right.due_date ? direction : -direction;
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const offset = (safePage - 1) * pageSize;

  return {
    items: filtered.slice(offset, offset + pageSize),
    total: filtered.length,
    page: safePage,
    pageCount,
  };
}
