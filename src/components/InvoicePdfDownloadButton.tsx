"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { Invoice } from "@/utils/soroban";
import {
  getInvoicePageUrl,
  getInvoicePdfFilename,
  getInvoicePdfRows,
} from "@/utils/invoicePdf";

interface InvoicePdfDownloadButtonProps {
  invoice: Invoice;
}

export default function InvoicePdfDownloadButton({ invoice }: InvoicePdfDownloadButtonProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const invoiceUrl = getInvoicePageUrl(invoice.id, origin);

  const downloadPdf = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const rows = getInvoicePdfRows(invoice);
      const qrDataUrl = qrCanvasRef.current?.toDataURL("image/png");

      doc.setFillColor(16, 24, 39);
      doc.rect(0, 0, 612, 112, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("ILN Invoice", 48, 52);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Invoice Liquidity Network", 48, 76);

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(`Invoice #${invoice.id.toString()}`, 48, 154);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Generated client-side from the ILN invoice detail page.", 48, 174);

      let y = 220;
      rows.forEach((row) => {
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(row.label.toUpperCase(), 48, y);

        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const wrapped = doc.splitTextToSize(row.value, 360);
        doc.text(wrapped, 48, y + 18);
        y += 42 + Math.max(0, wrapped.length - 1) * 14;
      });

      if (qrDataUrl) {
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(424, 142, 140, 166, 12, 12);
        doc.addImage(qrDataUrl, "PNG", 444, 160, 100, 100);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text("Scan to open invoice", 446, 282);
      }

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text("Invoice page", 48, 720);
      doc.setTextColor(37, 99, 235);
      doc.text(invoiceUrl, 48, 736);

      doc.save(getInvoicePdfFilename(invoice.id));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <QRCodeCanvas
        ref={qrCanvasRef}
        value={invoiceUrl}
        size={160}
        includeMargin
        className="hidden"
        aria-hidden="true"
      />
      <button
        onClick={() => void downloadPdf()}
        disabled={isGenerating}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/30 px-4 py-3 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">picture_as_pdf</span>
        {isGenerating ? "Generating PDF..." : "Download PDF"}
      </button>
    </>
  );
}
