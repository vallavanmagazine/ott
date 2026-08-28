/**
 * CSV export for admin tables (audit logs, payments, invoices, earnings).
 * Client-side only — builds a Blob and triggers a download, no server round-trip.
 */

/** RFC-4180 quoting: wrap in quotes and double any embedded quote. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\r\n');
}

/**
 * Download `rows` as a CSV file. The BOM makes Excel open UTF-8 (Tamil text)
 * correctly instead of mojibake.
 */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const blob = new Blob(['﻿' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** `vallavan-audit-2026-08-29.csv` */
export function datedFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
