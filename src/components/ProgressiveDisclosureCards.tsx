'use client';

import React, { useId, useState } from 'react';

export interface DisclosureColumn<T> {
  /** Stable identifier for the column. */
  id: string;
  /** Header / label shown for the field. */
  label: React.ReactNode;
  /** Renders the cell value for a given row. */
  renderCell: (item: T) => React.ReactNode;
}

interface ProgressiveDisclosureCardsProps<T> {
  data: T[];
  columns: DisclosureColumn<T>[];
  keyExtractor: (item: T) => string;
  /**
   * Ids of the columns shown in the collapsed (summary) state. The remaining
   * columns are revealed when a row is expanded. Defaults to the first three
   * columns when omitted.
   */
  keyColumnIds?: string[];
  className?: string;
}

/**
 * Mobile-friendly representation of a data table using progressive disclosure:
 * each row collapses to a few key columns and expands on tap/keyboard to reveal
 * all remaining fields inline.
 *
 * Accessibility: the summary is a real <button> (focusable + Enter/Space
 * activatable) carrying `aria-expanded` and `aria-controls`; the detail panel
 * is a labelled region toggled in the DOM.
 */
export default function ProgressiveDisclosureCards<T>({
  data,
  columns,
  keyExtractor,
  keyColumnIds,
  className,
}: ProgressiveDisclosureCardsProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const baseId = useId();

  const keyIds = keyColumnIds ?? columns.slice(0, 3).map((c) => c.id);
  const keyColumns = columns.filter((c) => keyIds.includes(c.id));
  const detailColumns = columns.filter((c) => !keyIds.includes(c.id));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <ul className={`space-y-3 ${className ?? ''}`}>
      {data.map((item) => {
        const key = keyExtractor(item);
        const isOpen = expanded.has(key);
        const panelId = `${baseId}-${key}-panel`;

        return (
          <li
            key={key}
            className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest"
          >
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-xl"
            >
              <div className="flex min-w-0 flex-col gap-1">
                {keyColumns.map((col) => (
                  <span key={col.id} className="flex items-center gap-2 text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {col.label}
                    </span>
                    <span className="truncate">{col.renderCell(item)}</span>
                  </span>
                ))}
              </div>
              {detailColumns.length > 0 && (
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined shrink-0 text-on-surface-variant transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              )}
            </button>

            {detailColumns.length > 0 && (
              <div
                id={panelId}
                role="region"
                hidden={!isOpen}
                className="border-t border-outline-variant/10 px-4 py-3"
              >
                <dl className="space-y-2">
                  {detailColumns.map((col) => (
                    <div key={col.id} className="flex items-start justify-between gap-3">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {col.label}
                      </dt>
                      <dd className="text-right text-sm">{col.renderCell(item)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
