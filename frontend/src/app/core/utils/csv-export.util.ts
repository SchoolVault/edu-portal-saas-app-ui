/** Client-side CSV export (UTF-8 with BOM for Excel). Preamble rows align with server {@code CsvExportSupport}. */

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: string[][]): string {
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
}

/** Human-readable school line for export preambles (matches backend {@code SchoolExportBranding#displaySchoolLine} shape). */
export function buildCsvSchoolLine(schoolName?: string | null, schoolCode?: string | null): string | undefined {
  const n = (schoolName ?? '').trim();
  const c = (schoolCode ?? '').trim();
  if (!n && !c) return undefined;
  if (n && c) return `${n} (${c})`;
  return n || c;
}

export interface CsvDocumentMeta {
  documentTitle: string;
  schoolLine?: string;
  generatedAt?: Date;
}

/**
 * Single-column preamble rows + blank line, then callers append the tabular header/data rows.
 * Not for round-trip import templates.
 */
export function csvDocumentPreambleRows(meta: CsvDocumentMeta): string[][] {
  const at = meta.generatedAt ?? new Date();
  const rows: string[][] = [[`SchoolVault ERP — ${meta.documentTitle}`]];
  const school = meta.schoolLine?.trim();
  if (school) rows.push([school]);
  rows.push([`Generated (local time): ${at.toISOString()}`]);
  rows.push([]);
  return rows;
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rowsToCsv(rows);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsvDocument(filename: string, meta: CsvDocumentMeta, tableRows: string[][]): void {
  downloadCsv(filename, [...csvDocumentPreambleRows(meta), ...tableRows]);
}
