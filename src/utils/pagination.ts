/**
 * Page-based pagination helpers. Pure and list-agnostic so any table (e.g. the
 * freelancer invoice dashboard, #13) can cap rows per page consistently.
 */

/** Total number of pages for `total` items at `perPage` (never below 1). */
export function pageCountFor(total: number, perPage: number): number {
  if (perPage <= 0) return 1;
  return Math.max(1, Math.ceil(total / perPage));
}

/** The slice of `items` for the zero-based `page`, clamped to valid bounds. */
export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  if (perPage <= 0) return items;
  const lastPage = pageCountFor(items.length, perPage) - 1;
  const safePage = Math.min(Math.max(0, page), lastPage);
  const start = safePage * perPage;
  return items.slice(start, start + perPage);
}
