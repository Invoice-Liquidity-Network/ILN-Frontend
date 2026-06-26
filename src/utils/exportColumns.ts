export interface ExportColumn {
  key: string;
  label: string;
}

const STORAGE_PREFIX = "iln_export_columns_";

export function getStorageKey(filenamePrefix: string): string {
  return `${STORAGE_PREFIX}${filenamePrefix}`;
}

export function deriveExportColumns<T extends Record<string, unknown>>(data: T[]): ExportColumn[] {
  if (data.length === 0) return [];

  return Object.keys(data[0]).map((key) => ({
    key,
    label: humanizeColumnKey(key),
  }));
}

export function humanizeColumnKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function loadStoredColumnSelection(
  filenamePrefix: string,
  availableKeys: string[],
): string[] | null {
  if (typeof window === "undefined" || availableKeys.length === 0) return null;

  try {
    const raw = localStorage.getItem(getStorageKey(filenamePrefix));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const valid = parsed.filter((key): key is string => typeof key === "string" && availableKeys.includes(key));
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

export function saveStoredColumnSelection(filenamePrefix: string, selectedKeys: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(filenamePrefix), JSON.stringify(selectedKeys));
}

export function pickRecordColumns<T extends Record<string, unknown>>(row: T, columns: string[]): Record<string, unknown> {
  return columns.reduce<Record<string, unknown>>((acc, key) => {
    if (key in row) {
      acc[key] = row[key];
    }
    return acc;
  }, {});
}

export function pickDataColumns<T extends Record<string, unknown>>(data: T[], columns: string[]): Record<string, unknown>[] {
  return data.map((row) => pickRecordColumns(row, columns));
}
