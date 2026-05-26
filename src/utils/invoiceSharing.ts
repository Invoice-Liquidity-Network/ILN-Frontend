export function buildInvoiceCanonicalUrl(invoiceId: string | bigint, origin: string): string {
  const cleanOrigin = origin.replace(/\/$/, "");
  return `${cleanOrigin}/invoices/${invoiceId.toString()}`;
}

export function buildInvoiceMailtoUrl(invoiceId: string | bigint, invoiceUrl: string): string {
  const subject = `Invoice #${invoiceId.toString()} for review`;
  const body = [
    `Please review Invoice #${invoiceId.toString()} on ILN:`,
    "",
    invoiceUrl,
  ].join("\n");

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
