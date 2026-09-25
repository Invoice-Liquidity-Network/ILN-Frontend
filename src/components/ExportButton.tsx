'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Columns3 } from 'lucide-react';
import { exportToCSV, exportToJSON, filterByDateRange, DateRange } from '@/utils/exportData';
import {
  deriveExportColumns,
  loadStoredColumnSelection,
  pickDataColumns,
  saveStoredColumnSelection,
  type ExportColumn,
} from '@/utils/exportColumns';

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[];
  filenamePrefix: string;
  columns?: ExportColumn[];
}

export function ExportButton<T extends Record<string, any>>({
  data,
  filenamePrefix,
  columns: columnsProp,
}: ExportButtonProps<T>) {
  const [range, setRange] = useState<DateRange>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  const availableColumns = useMemo(
    () => columnsProp ?? deriveExportColumns(data),
    [columnsProp, data]
  );

  const availableKeys = useMemo(
    () => availableColumns.map((column) => column.key),
    [availableColumns]
  );

  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableKeys);

  useEffect(() => {
    if (availableKeys.length === 0) {
      setSelectedColumns([]);
      return;
    }

    const stored = loadStoredColumnSelection(filenamePrefix, availableKeys);
    setSelectedColumns(stored ?? availableKeys);
  }, [availableKeys, filenamePrefix]);

  useEffect(() => {
    if (selectedColumns.length === 0) return;
    saveStoredColumnSelection(filenamePrefix, selectedColumns);
  }, [filenamePrefix, selectedColumns]);

  useEffect(() => {
    if (!columnsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (columnsRef.current && !columnsRef.current.contains(event.target as Node)) {
        setColumnsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnsOpen]);

  const allSelected = selectedColumns.length === availableKeys.length;
  const noneSelected = selectedColumns.length === 0;

  const toggleColumn = (key: string) => {
    setSelectedColumns((current) =>
      current.includes(key) ? current.filter((column) => column !== key) : [...current, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(availableKeys);
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (selectedColumns.length === 0) return;

    const customStart = startDate ? new Date(startDate) : undefined;
    const customEnd = endDate ? new Date(endDate) : undefined;
    const filtered = filterByDateRange(data, range, customStart, customEnd);
    const projected = pickDataColumns(filtered, selectedColumns);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${filenamePrefix}-${dateStr}.${format}`;

    if (format === 'csv') {
      exportToCSV(projected, filename, selectedColumns);
    } else {
      exportToJSON(projected, filename, selectedColumns);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-2">
      <div className="relative" ref={columnsRef}>
        <button
          type="button"
          onClick={() => setColumnsOpen((open) => !open)}
          aria-expanded={columnsOpen}
          aria-haspopup="listbox"
          aria-label={`Select export columns, ${selectedColumns.length} of ${availableKeys.length} selected`}
          className="flex items-center gap-1.5 rounded-md border border-outline-variant/30 bg-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <Columns3 className="h-3.5 w-3.5" />
          Columns ({selectedColumns.length}/{availableKeys.length})
        </button>

        {columnsOpen && availableColumns.length > 0 ? (
          <div
            role="listbox"
            aria-label="Export columns"
            aria-multiselectable="true"
            className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Export columns
              </p>
              <button
                type="button"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="max-h-56 space-y-1 overflow-y-auto">
              {availableColumns.map((column) => {
                const checked = selectedColumns.includes(column.key);
                return (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface hover:bg-surface-container-low"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColumn(column.key)}
                      className="h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-primary/40"
                    />
                    <span>{column.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <select
        aria-label="Date range"
        className="rounded-md border border-outline-variant/30 bg-surface-container-high px-3 py-1.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
        value={range}
        onChange={(e) => setRange(e.target.value as DateRange)}
      >
        <option value="all">All time</option>
        <option value="90">Last 90 days</option>
        <option value="365">Last year</option>
        <option value="custom">Custom range</option>
      </select>

      {range === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Export start date"
            className="rounded-md border border-outline-variant/30 bg-surface-container-high px-2 py-1 text-sm text-on-surface outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-sm text-on-surface-variant">to</span>
          <input
            type="date"
            aria-label="Export end date"
            className="rounded-md border border-outline-variant/30 bg-surface-container-high px-2 py-1 text-sm text-on-surface outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      )}

      <div className="mx-1 h-6 w-px bg-outline-variant/30" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={noneSelected}
          onClick={() => handleExport('csv')}
          className="flex items-center gap-1.5 rounded-md bg-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
        <button
          type="button"
          disabled={noneSelected}
          onClick={() => handleExport('json')}
          className="flex items-center gap-1.5 rounded-md bg-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> JSON
        </button>
      </div>
    </div>
  );
}
