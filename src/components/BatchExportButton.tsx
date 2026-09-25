'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { Download, Loader2 } from 'lucide-react';
import { downloadFile } from '@/utils/exportData';

interface BatchExportButtonProps<T extends Record<string, unknown>> {
  selectedItems: T[];
  filenamePrefix: string;
  /** Optional function to flatten/transform each item before export */
  serializeItem?: (item: T) => Record<string, unknown>;
}

export function BatchExportButton<T extends Record<string, unknown>>({
  selectedItems,
  filenamePrefix,
  serializeItem,
}: BatchExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const count = selectedItems.length;

  const serialize = (item: T): Record<string, unknown> =>
    serializeItem ? serializeItem(item) : flattenItem(item);

  const handleCSV = async () => {
    if (count === 0) return;
    setIsExporting(true);
    try {
      const rows = selectedItems.map(serialize);
      const csv = Papa.unparse(rows, { header: true });
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csv, `${filenamePrefix}-batch-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDF = async () => {
    if (count === 0) return;
    setIsExporting(true);
    try {
      // Dynamic import keeps jspdf out of the initial bundle
      const { default: jsPDF } = await import('jspdf');
      const dateStr = new Date().toISOString().split('T')[0];
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 14;
      const lineHeight = 6;
      const maxWidth = pageWidth - marginLeft * 2;

      selectedItems.forEach((item, index) => {
        if (index > 0) doc.addPage();

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Invoice Export — ${filenamePrefix}`, marginLeft, 20);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(`Generated: ${dateStr}`, marginLeft, 27);
        doc.setTextColor(0);

        const flat = serialize(item);
        let y = 36;

        doc.setFontSize(10);
        Object.entries(flat).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const valStr = value === null || value === undefined ? '—' : String(value);

          doc.setFont('helvetica', 'bold');
          const labelWidth = doc.getTextWidth(`${label}: `);
          doc.text(`${label}: `, marginLeft, y);

          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(valStr, maxWidth - labelWidth);
          doc.text(lines, marginLeft + labelWidth, y);

          y += lineHeight * lines.length;

          if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
          }
        });

        // Divider
        doc.setDrawColor(220);
        doc.line(marginLeft, y + 2, pageWidth - marginLeft, y + 2);
      });

      doc.save(`${filenamePrefix}-batch-${dateStr}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm">
      <span className="font-medium text-primary">{count} selected</span>

      <div className="h-4 w-px bg-primary/20" />

      {isExporting ? (
        <span className="flex items-center gap-1 text-on-surface-variant">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Exporting…
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={handleCSV}
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-primary hover:bg-primary/10 transition-colors"
            aria-label={`Export ${count} selected invoices as CSV`}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            type="button"
            onClick={handlePDF}
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-primary hover:bg-primary/10 transition-colors"
            aria-label={`Export ${count} selected invoices as PDF`}
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
        </>
      )}
    </div>
  );
}

/** Recursively flatten an object, converting bigints to strings */
function flattenItem(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (typeof v === 'bigint') {
      result[key] = v.toString();
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenItem(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      result[key] = v.map((el) => (typeof el === 'bigint' ? el.toString() : el)).join(', ');
    } else {
      result[key] = v;
    }
  }
  return result;
}
