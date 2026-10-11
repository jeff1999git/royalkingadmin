// Export builders for the Deliveries page: print-to-PDF, PNG and CSV. This
// module is loaded with import() only when an export button is pressed, so
// none of it ships in the page's main chunk.

import { toCsv, type CsvValue } from "../../../lib/csv";
import { formatDateTime, formatNumber, roundMoney } from "../../../lib/format";
import {
  CASE_SIZES,
  casesBySizeText,
  emptyCasesBySize,
  isCaseSize,
  productLabel,
  toProductType,
} from "../../../lib/supplyProduct";
import { paymentLabel } from "../../components/PaymentPill";
import type { SupplyLog } from "../../hooks/useAdminQueries";

export type ExportTab = "water" | "cash";

type ExportRow = {
  no: number;
  dateTime: string;
  driver: string;
  customer?: string;
  cans?: string;
  cases?: string;
  caseSize?: string;
  cansTakenBack?: string;
  amount: string;
  cashType?: string;
  note?: string;
  remark: string;
};

type ExportColumn = { key: keyof ExportRow; title: string; width: number };

// The most rows the PNG renderer draws; beyond that the canvas gets too large
// for phones.
export const MAX_PNG_ROWS = 250;

function exportRows(logs: SupplyLog[]): ExportRow[] {
  return logs.map<ExportRow>((log, index) => ({
    no: index + 1,
    dateTime: formatDateTime(log.suppliedAt),
    driver: `${log.driver?.name ?? ""} (@${log.driver?.username ?? ""})`,
    customer: log.customer?.name ?? log.pointName ?? "-",
    cans: log.cansDelivered !== undefined ? String(log.cansDelivered) : "-",
    cases: log.casesDelivered !== undefined ? String(log.casesDelivered) : "-",
    caseSize: toProductType(log.productType) === "case" && log.caseSize ? log.caseSize : "-",
    cansTakenBack: log.cansTakenBack !== undefined ? String(log.cansTakenBack) : "-",
    amount: log.amount !== undefined ? String(log.amount) : "-",
    cashType: log.cashType ?? "-",
    note: log.notes?.trim() ? log.notes : "-",
    remark: log.adminRemark?.trim() ? log.adminRemark : "-",
  }));
}

function exportTotals(logs: SupplyLog[]) {
  const totals = logs.reduce(
    (acc, log) => {
      acc.amount += log.amount ?? 0;
      acc.cans += log.cansDelivered ?? 0;
      acc.cases += log.casesDelivered ?? 0;
      acc.takenBack += log.cansTakenBack ?? 0;
      return acc;
    },
    { amount: 0, cans: 0, cases: 0, takenBack: 0 },
  );
  totals.amount = roundMoney(totals.amount);
  return totals;
}

// Cases per bottle size over a set of rows, for the export totals.
export function casesBySizeOf(logs: SupplyLog[]) {
  const bySize = emptyCasesBySize();
  for (const log of logs) {
    if (toProductType(log.productType) === "case" && isCaseSize(log.caseSize)) {
      bySize[log.caseSize] += log.casesDelivered ?? 0;
    }
  }
  return bySize;
}

// Driver-entered text (names, notes, remarks) goes into the print window's
// raw HTML — escape it so it can never run as markup there.
function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Print (PDF) ──
// The caller opens the window synchronously in the click handler (so pop-up
// blockers allow it) and hands it here to be filled and printed.
export function writePrintReport(reportWindow: Window, tab: ExportTab, logs: SupplyLog[]) {
  const rows = exportRows(logs);
  const totals = exportTotals(logs);
  const isCashTab = tab === "cash";
  const casesText = isCashTab ? "" : casesBySizeText(casesBySizeOf(logs), totals.cases);
  const reportTitle = isCashTab ? "Cash Credits" : "Water Supplies";
  const headerRow = isCashTab
    ? `<tr>
          <th>No.</th>
          <th>Date & Time</th>
          <th>Driver</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Driver Remark</th>
          <th>Admin Remark</th>
        </tr>`
    : `<tr>
          <th>No.</th>
          <th>Date & Time</th>
          <th>Driver</th>
          <th>Customer</th>
          <th>Cans Del.</th>
          <th>Cases Del.</th>
          <th>Case Size</th>
          <th>Taken Back</th>
          <th>Amount</th>
          <th>Admin Remark</th>
        </tr>`;
  const tableRows = rows
    .map((r) =>
      isCashTab
        ? `<tr>
          <td>${r.no}</td>
          <td>${escapeHtml(r.dateTime)}</td>
          <td>${escapeHtml(r.driver)}</td>
          <td>${escapeHtml(r.cashType ?? "-")}</td>
          <td>${escapeHtml(r.amount)}</td>
          <td>${escapeHtml(r.note ?? "-")}</td>
          <td>${escapeHtml(r.remark)}</td>
        </tr>`
        : `<tr>
          <td>${r.no}</td>
          <td>${escapeHtml(r.dateTime)}</td>
          <td>${escapeHtml(r.driver)}</td>
          <td>${escapeHtml(r.customer ?? "-")}</td>
          <td>${escapeHtml(r.cans ?? "-")}</td>
          <td>${escapeHtml(r.cases ?? "-")}</td>
          <td>${escapeHtml(r.caseSize ?? "-")}</td>
          <td>${escapeHtml(r.cansTakenBack ?? "-")}</td>
          <td>${escapeHtml(r.amount)}</td>
          <td>${escapeHtml(r.remark)}</td>
        </tr>`,
    )
    .join("");
  const footerRow = isCashTab
    ? `<tr>
          <td colspan="4">Total</td>
          <td>${formatNumber(totals.amount)}</td>
          <td colspan="2"></td>
        </tr>`
    : `<tr>
          <td colspan="4">Total</td>
          <td>${totals.cans}</td>
          <td>${totals.cases}</td>
          <td></td>
          <td>${totals.takenBack}</td>
          <td>${formatNumber(totals.amount)}</td>
          <td></td>
        </tr>`;
  reportWindow.document.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { margin: 0 0 8px; }
            .meta { margin-bottom: 16px; color: #444; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cfd8e3; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #f5f7fb; }
            tfoot td { font-weight: 700; background: #f5f7fb; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <div class="meta">Generated: ${formatDateTime(new Date())} | Rows: ${rows.length} | <span style="font-weight:700;">Total Amount (rows shown): ₹${formatNumber(totals.amount)}</span>${casesText ? ` | Cases: ${escapeHtml(casesText)}` : ""}</div>
          <table>
            <thead>
              ${headerRow}
            </thead>
            <tbody>${tableRows}</tbody>
            <tfoot>${footerRow}</tfoot>
          </table>
        </body>
      </html>
    `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

// ── PNG ──
export function renderPngBlob(tab: ExportTab, logs: SupplyLog[]): Promise<Blob> {
  const rows = exportRows(logs).slice(0, MAX_PNG_ROWS);
  const totals = exportTotals(logs);
  const isCashTab = tab === "cash";
  const casesText = isCashTab ? "" : casesBySizeText(casesBySizeOf(logs), totals.cases);
  const reportTitle = isCashTab ? "Cash Credits" : "Water Supplies";
  const columns: ExportColumn[] = isCashTab
    ? [
        { key: "no", title: "No.", width: 60 },
        { key: "dateTime", title: "Date & Time", width: 200 },
        { key: "driver", title: "Driver", width: 260 },
        { key: "cashType", title: "Type", width: 110 },
        { key: "amount", title: "Amount", width: 120 },
        { key: "note", title: "Driver Remark", width: 240 },
        { key: "remark", title: "Admin Remark", width: 240 },
      ]
    : [
        { key: "no", title: "No.", width: 60 },
        { key: "dateTime", title: "Date & Time", width: 200 },
        { key: "driver", title: "Driver", width: 260 },
        { key: "customer", title: "Customer", width: 220 },
        { key: "cans", title: "Cans Del.", width: 80 },
        { key: "cases", title: "Cases Del.", width: 80 },
        { key: "caseSize", title: "Case Size", width: 80 },
        { key: "cansTakenBack", title: "Taken Back", width: 90 },
        { key: "amount", title: "Amount", width: 110 },
        { key: "remark", title: "Admin Remark", width: 240 },
      ];

  const outerPadding = 20;
  const titleHeight = 80;
  const headerHeight = 34;
  const lineHeight = 16;
  const cellPaddingX = 6;
  const cellPaddingY = 6;
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const width = tableWidth + outerPadding * 2;

  const measureCanvas = document.createElement("canvas");
  const measure = measureCanvas.getContext("2d");
  if (!measure) return Promise.reject(new Error("canvas unsupported"));
  measure.font = "12px Arial";

  function wrapText(value: string, maxWidth: number) {
    const words = value.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure!.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [""];
  }

  const rowLayouts = rows.map((row) => {
    const cellLines = columns.map((col) => wrapText(String(row[col.key] ?? ""), col.width - cellPaddingX * 2));
    const maxLines = Math.max(...cellLines.map((l) => l.length), 1);
    const rowHeight = Math.max(headerHeight, maxLines * lineHeight + cellPaddingY * 2);
    return { row, cellLines, rowHeight };
  });

  const footerHeight = headerHeight;
  const tableHeight = headerHeight + rowLayouts.reduce((sum, r) => sum + r.rowHeight, 0) + footerHeight;
  const height = outerPadding + titleHeight + tableHeight + outerPadding;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas unsupported"));

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 24px Arial";
  ctx.fillText(reportTitle, outerPadding, outerPadding + 24);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#334155";
  ctx.fillText(`Generated: ${formatDateTime(new Date())}`, outerPadding, outerPadding + 48);
  ctx.font = "700 14px Arial";
  ctx.fillText(
    `Total Amount (rows shown): ₹${formatNumber(totals.amount)}${casesText ? `   ·   Cases: ${casesText}` : ""}`,
    outerPadding,
    outerPadding + 68,
  );

  const tableX = outerPadding;
  let y = outerPadding + titleHeight;

  ctx.fillStyle = "#f5f7fb";
  ctx.fillRect(tableX, y, tableWidth, headerHeight);
  ctx.strokeStyle = "#cfd8e3";
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, y, tableWidth, headerHeight);

  const columnLineBottom = y + headerHeight + rowLayouts.reduce((sum, r) => sum + r.rowHeight, 0) + footerHeight;
  let x = tableX;
  ctx.font = "700 12px Arial";
  ctx.fillStyle = "#111827";
  for (const col of columns) {
    ctx.fillText(col.title, x + cellPaddingX, y + 22);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, columnLineBottom);
    ctx.stroke();
    x += col.width;
  }
  ctx.beginPath();
  ctx.moveTo(tableX + tableWidth, y);
  ctx.lineTo(tableX + tableWidth, columnLineBottom);
  ctx.stroke();

  y += headerHeight;
  ctx.font = "12px Arial";
  for (const layout of rowLayouts) {
    ctx.strokeStyle = "#cfd8e3";
    ctx.strokeRect(tableX, y, tableWidth, layout.rowHeight);
    let colX = tableX;
    for (let i = 0; i < columns.length; i++) {
      const lines = layout.cellLines[i] ?? [""];
      ctx.fillStyle = "#0f172a";
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex] ?? "";
        ctx.fillText(line, colX + cellPaddingX, y + cellPaddingY + 12 + lineIndex * lineHeight);
      }
      const column = columns[i];
      if (!column) continue;
      colX += column.width;
    }
    y += layout.rowHeight;
  }

  // Bold totals row at the bottom of the table.
  const footerValues: Partial<Record<keyof ExportRow, string>> = isCashTab
    ? { no: "Total", amount: formatNumber(totals.amount) }
    : {
        no: "Total",
        cans: String(totals.cans),
        cases: String(totals.cases),
        cansTakenBack: String(totals.takenBack),
        amount: formatNumber(totals.amount),
      };
  ctx.fillStyle = "#f5f7fb";
  ctx.fillRect(tableX, y, tableWidth, footerHeight);
  ctx.strokeStyle = "#cfd8e3";
  ctx.strokeRect(tableX, y, tableWidth, footerHeight);
  ctx.font = "700 12px Arial";
  ctx.fillStyle = "#111827";
  let footerX = tableX;
  for (const col of columns) {
    const value = footerValues[col.key];
    if (value) ctx.fillText(value, footerX + cellPaddingX, y + 22);
    footerX += col.width;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((pngBlob) => {
      if (pngBlob) resolve(pngBlob);
      else reject(new Error("canvas encode failed"));
    }, "image/png");
  });
}

// ── Sheet (CSV) ──
// Date and 24-hour time as separate columns in IST, in a form Google Sheets
// and Excel both read as a real date and time.
function sheetDateTime(value: string) {
  const d = new Date(new Date(value).getTime() + 330 * 60 * 1000);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

const blankToNull = (value?: string) => (value?.trim() ? value.trim() : null);

// One row per delivery, then a totals row after a blank line so the data
// block stays easy to sort and filter.
function deliverySheetRows(logs: SupplyLog[]): CsvValue[][] {
  const header = [
    "No.", "Date", "Time", "Driver", "Customer", "Area", "Product",
    "Cans Delivered", "Cases Delivered", "Case Size", "Price per Case (₹)", "Cans Taken Back", "Amount (₹)",
    "Payment", "Vehicle", "Driver Note", "Admin Remark",
  ];
  const totals = { cans: 0, cases: 0, takenBack: 0, amount: 0 };
  const rows = logs.map<CsvValue[]>((log, index) => {
    const { date, time } = sheetDateTime(log.suppliedAt);
    totals.cans += log.cansDelivered ?? 0;
    totals.cases += log.casesDelivered ?? 0;
    totals.takenBack += log.cansTakenBack ?? 0;
    totals.amount += log.amount ?? 0;
    const isCase = toProductType(log.productType) === "case";
    return [
      index + 1, date, time,
      log.driver?.name,
      log.customer?.name ?? log.pointName,
      log.customer?.area,
      productLabel(toProductType(log.productType)),
      log.cansDelivered, log.casesDelivered,
      isCase ? log.caseSize : null, isCase ? log.casePrice : null,
      log.cansTakenBack, log.amount,
      paymentLabel(log.paymentStatus),
      log.vehicle ? [log.vehicle.name, log.vehicle.vehicleNumber].filter(Boolean).join(" - ") : null,
      blankToNull(log.notes),
      blankToNull(log.adminRemark),
    ];
  });
  const totalRow: CsvValue[] = ["Total", null, null, null, null, null, null, totals.cans, totals.cases, null, null, totals.takenBack, roundMoney(totals.amount)];
  // Then cases per bottle size, with the count in the Cases Delivered column.
  const bySize = casesBySizeOf(logs);
  const sizeRows: CsvValue[][] = CASE_SIZES.filter((size) => bySize[size] > 0).map((size) => [
    `Cases ${size}`, null, null, null, null, null, null, null, bySize[size],
  ]);
  const unsized = totals.cases - CASE_SIZES.reduce((sum, size) => sum + bySize[size], 0);
  if (unsized > 0) sizeRows.push(["Cases size not set", null, null, null, null, null, null, null, unsized]);
  return [header, ...rows, [], totalRow, ...sizeRows];
}

function cashSheetRows(logs: SupplyLog[]): CsvValue[][] {
  const header = ["No.", "Date", "Time", "Driver", "Type", "Amount (₹)", "Driver Remark", "Admin Remark", "Bill Image"];
  let totalAmount = 0;
  const rows = logs.map<CsvValue[]>((log, index) => {
    const { date, time } = sheetDateTime(log.suppliedAt);
    totalAmount += log.amount ?? 0;
    return [
      index + 1, date, time,
      log.driver?.name,
      log.cashType === "fuel" ? "Fuel" : log.cashType === "debit" ? "Debit" : null,
      log.amount,
      blankToNull(log.notes),
      blankToNull(log.adminRemark),
      log.billImageUrl,
    ];
  });
  return [header, ...rows, [], ["Total", null, null, null, null, roundMoney(totalAmount)]];
}

export function buildCsv(tab: ExportTab, logs: SupplyLog[], options?: { bom?: boolean }): string {
  return toCsv(tab === "water" ? deliverySheetRows(logs) : cashSheetRows(logs), options);
}
