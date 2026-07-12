'use client';

import { useRef, useState, useCallback } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { formatAddress, formatDate, formatUSDC } from '@/utils/format';

interface InvoiceQRModalProps {
  invoiceId: bigint;
  amount: bigint;
  dueDate: bigint;
  freelancer: string;
  baseUrl?: string;
  onClose: () => void;
}

export default function InvoiceQRModal({
  invoiceId,
  amount,
  dueDate,
  freelancer,
  baseUrl,
  onClose,
}: InvoiceQRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const payUrl = `${origin}/pay/${invoiceId.toString()}`;

  const downloadPng = useCallback(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const dataUrl = canvasEl.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ILN-Invoice-${invoiceId.toString()}-QR.png`;
    link.href = dataUrl;
    link.click();
  }, [invoiceId]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const canvasEl = canvasRef.current;
    const qrDataUrl = canvasEl?.toDataURL('image/png') || '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice QR Code #${invoiceId.toString()}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              text-align: center;
            }
            .header {
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 24px;
              margin: 0 0 10px 0;
              color: #333;
            }
            .qr-section {
              margin: 30px 0;
            }
            .qr-image {
              max-width: 300px;
              height: auto;
              border: 2px solid #e0e0e0;
              padding: 16px;
              border-radius: 8px;
              background: white;
            }
            .invoice-details {
              margin: 30px 0;
              border-top: 1px solid #e0e0e0;
              border-bottom: 1px solid #e0e0e0;
              padding: 20px;
              text-align: left;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
            }
            .detail-value {
              font-weight: 500;
              color: #333;
            }
            .payment-link {
              margin-top: 20px;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            .payment-link p {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #666;
            }
            .payment-url {
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
              background: white;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #e0e0e0;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice QR Code</h1>
              <p style="margin: 0; color: #999;">Invoice #${invoiceId.toString()}</p>
            </div>
            <div class="qr-section">
              <img src="${qrDataUrl}" alt="Invoice QR Code" class="qr-image">
            </div>
            <div class="invoice-details">
              <div class="detail-row">
                <span class="detail-label">Invoice ID</span>
                <span class="detail-value">#${invoiceId.toString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="detail-value">${formatUSDC(amount)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date</span>
                <span class="detail-value">${formatDate(dueDate)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Freelancer</span>
                <span class="detail-value">${formatAddress(freelancer)}</span>
              </div>
            </div>
            <div class="payment-link">
              <p>Payment Link:</p>
              <div class="payment-url">${payUrl}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [invoiceId, amount, dueDate, freelancer, payUrl]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }, [payUrl]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invoice QR Code"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl flex flex-col items-center gap-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Close QR modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <h2 className="text-lg font-bold text-on-surface">Scan to pay this invoice</h2>

        {/* Hidden canvas used for PNG download */}
        <QRCodeCanvas ref={canvasRef} value={payUrl} size={240} includeMargin className="hidden" />

        {/* Visible SVG QR code */}
        <div className="rounded-2xl border border-outline-variant/20 p-4 bg-white">
          <QRCodeSVG
            value={payUrl}
            size={220}
            includeMargin={false}
            aria-label={`QR code for invoice ${invoiceId.toString()}`}
          />
        </div>

        {/* Invoice summary */}
        <div className="w-full rounded-2xl bg-surface-container-low p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Invoice</span>
            <span className="font-bold">#{invoiceId.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Amount</span>
            <span className="font-bold">{formatUSDC(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Due</span>
            <span className="font-semibold">{formatDate(dueDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Freelancer</span>
            <span className="font-mono text-xs">{formatAddress(freelancer)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full flex-col">
          <div className="flex gap-3 w-full">
            <button
              onClick={downloadPng}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download PNG
            </button>
            <button
              onClick={() => void copyLink()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/30 px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">
                {linkCopied ? 'check' : 'link'}
              </span>
              {linkCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/30 px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
