/**
 * Barrel for contract-data query hooks and the shared query key factories.
 *
 * Import query keys / timings and typed hooks from here:
 *   import { invoiceKeys, useInvoiceCount } from "@/hooks/queries";
 */
export * from './keys';
export { useInvoiceCount } from './useInvoiceCount';
export { useParameterUpdates } from './useParameterUpdates';
