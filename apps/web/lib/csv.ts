// Builds a CSV file that opens directly in Google Sheets and Excel.

export type CsvValue = string | number | null | undefined;

function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  // Driver-entered text starting with = + - @ would run as a formula when the
  // file is opened; a leading apostrophe keeps it as plain text.
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// The byte-order mark makes Excel read ₹ and non-English names as UTF-8 in a
// downloaded file. Leave it out when the text goes somewhere else, such as an
// upload to Google Drive.
export function toCsv(rows: CsvValue[][], { bom = true }: { bom?: boolean } = {}): string {
  const text = `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  return bom ? `\uFEFF${text}` : text;
}
