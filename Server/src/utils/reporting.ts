export interface ReportDateRange {
  from: Date;
  to: Date;
}

export function parseReportDateRange(
  fromValue: unknown,
  toValue: unknown,
  now = new Date()
): ReportDateRange | null {
  if (
    (fromValue !== undefined && typeof fromValue !== "string") ||
    (toValue !== undefined && typeof toValue !== "string")
  ) {
    return null;
  }
  const fromText = fromValue as string | undefined;
  const toText = toValue as string | undefined;
  if (
    (fromText !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(fromText)) ||
    (toText !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(toText))
  ) {
    return null;
  }

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const to = toText ? new Date(`${toText}T00:00:00.000Z`) : today;
  const from = fromText
    ? new Date(`${fromText}T00:00:00.000Z`)
    : new Date(to.getTime() - 364 * 24 * 60 * 60 * 1000);
  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    (fromText && from.toISOString().slice(0, 10) !== fromText) ||
    (toText && to.toISOString().slice(0, 10) !== toText)
  ) {
    return null;
  }
  to.setUTCDate(to.getUTCDate() + 1);
  if (from >= to || to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
    return null;
  }
  return { from, to };
}

export function createCsv(
  columns: string[],
  rows: Array<Record<string, unknown>>
) {
  const escapeCell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [
    columns.map(escapeCell).join(","),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(",")),
  ].join("\r\n");
}
