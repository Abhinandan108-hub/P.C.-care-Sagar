/** Escape a single CSV cell value per RFC 4180. */
function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV file from an array of objects and trigger a browser download.
 * Column order follows the keys of the first row unless `columns` is given.
 */
export function exportToCSV<T extends object>(
  filename: string,
  rows: T[],
  columns?: { key: keyof T; label: string }[]
): void {
  if (rows.length === 0) return;

  const cols =
    columns ?? (Object.keys(rows[0]) as (keyof T)[]).map((key) => ({ key, label: String(key) }));

  const header = cols.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCell(row[c.key])).join(","))
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
