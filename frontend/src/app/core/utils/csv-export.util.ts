/** Client-side CSV export for report tables (UTF-8 with BOM for Excel). */

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: string[][]): string {
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
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
