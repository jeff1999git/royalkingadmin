"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toCsv, type CsvValue } from "../../../lib/csv";
import {
  googleClientId,
  loadGoogleIdentity,
  requestDriveToken,
  saveCsvAsGoogleSheet,
} from "../../../lib/googleDrive";
import { cloudinaryAuto, cloudinaryThumb } from "../../../lib/imageUrl";
import {
  deliveredQuantity,
  parseOptionalNumber,
  productLabel,
  toProductType,
  validateDeliveryQuantities,
  type DeliveryQuantities,
  type ProductType,
} from "../../../lib/supplyProduct";
import ProductPill from "../../components/ProductPill";
import {
  fetchAllSupplies,
  useAdminAddedSupplies,
  useAdminCashCredits,
  useAdminCustomers,
  useAdminDrivers,
  useAdminQueryClient,
  type PaginatedSupplyLogsWithStats,
} from "../../hooks/useAdminQueries";

interface SupplyLog {
  _id: string;
  suppliedAt: string;
  formattedSuppliedAt?: string;
  pointName?: string;
  cansDelivered?: number;
  cansTakenBack?: number;
  casesDelivered?: number;
  notes?: string;
  amount?: number;
  logType?: "water" | "cash";
  // Missing on older deliveries, which count as "can".
  productType?: ProductType;
  cashType?: "debit" | "fuel";
  paymentStatus?: "cash" | "upi" | "not_paid";
  adminRemark?: string;
  billImageUrl?: string;
  billImagePublicId?: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
    area?: string;
  };
  driver?: {
    _id: string;
    name: string;
    username: string;
    phone?: string;
  };
  vehicle?: {
    _id: string;
    name: string;
    vehicleNumber: string;
    capacity: string;
  };
}

type ExportRow = {
  no: number;
  dateTime: string;
  driver: string;
  customer?: string;
  cans?: string;
  cases?: string;
  cansTakenBack?: string;
  vehicle?: string;
  amount: string;
  cashType?: string;
  note?: string;
  remark: string;
};

type ExportColumn = {
  key: keyof ExportRow;
  title: string;
  width: number;
};

type Filters = {
  date: string;
  month: string;
  driver: string;
  vehicle: string;
  customer: string;
  paymentStatus: "" | "cash" | "upi" | "not_paid";
  productType: "" | ProductType;
};

function todayInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateHeading(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRelativeDayLabel(value: string | Date) {
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatDateHeading(target);
}

function maskText(value: string, max = 12) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

// The driver's note on a log, or "" when there isn't one. Driver entries save
// an empty note as "", so blank and whitespace-only notes count as none.
function driverNote(log: { notes?: string }): string {
  return log.notes?.trim() ?? "";
}

// One-line preview of a driver's note, shown in the table so it isn't missed.
// The full text is in the tooltip and in the details dialog.
function NotePreview({ note }: { note: string }) {
  return (
    <div className="supply-note" role="note" aria-label={`Driver note: ${note}`} title={note}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span aria-hidden="true">{note}</span>
    </div>
  );
}

// Quantities to send for a delivery form: the one quantity input holds the
// chosen product's count; taken back only applies to cans.
function formQuantities(productType: ProductType, quantity: string, takenBack: string): DeliveryQuantities {
  return productType === "case"
    ? { productType: "case", casesDelivered: parseOptionalNumber(quantity) }
    : { productType: "can", cansDelivered: parseOptionalNumber(quantity), cansTakenBack: parseOptionalNumber(takenBack) };
}

// Radio pair for choosing Can or Case in the add and edit dialogs.
function ProductRadios({
  name,
  value,
  onChange,
}: {
  name: string;
  value: ProductType;
  onChange: (productType: ProductType) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
      {(["can", "case"] as const).map((pt) => (
        <label key={pt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: value === pt ? 700 : 500 }}>
          <input type="radio" name={name} value={pt} checked={value === pt} onChange={() => onChange(pt)} />
          {pt === "can" ? "Can" : "Case"}
        </label>
      ))}
    </div>
  );
}

// ── Sheet (CSV) download ──
// Date and 24-hour time as separate columns in the viewer's local time, in a
// form Google Sheets and Excel both read as a real date and time.
function sheetDateTime(value: string) {
  const d = new Date(value);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function paymentLabel(ps?: SupplyLog["paymentStatus"]) {
  return !ps || ps === "cash" ? "Cash" : ps === "upi" ? "UPI" : "Not Paid";
}

const blankToNull = (value?: string) => (value?.trim() ? value.trim() : null);

// One row per delivery, then a totals row after a blank line so the data
// block stays easy to sort and filter.
function deliverySheetRows(logs: SupplyLog[]): CsvValue[][] {
  const header = [
    "No.", "Date", "Time", "Driver", "Customer", "Area", "Product",
    "Cans Delivered", "Cases Delivered", "Cans Taken Back", "Amount (₹)",
    "Payment", "Vehicle", "Driver Note", "Admin Remark",
  ];
  const totals = { cans: 0, cases: 0, takenBack: 0, amount: 0 };
  const rows = logs.map<CsvValue[]>((log, index) => {
    const { date, time } = sheetDateTime(log.suppliedAt);
    totals.cans += log.cansDelivered ?? 0;
    totals.cases += log.casesDelivered ?? 0;
    totals.takenBack += log.cansTakenBack ?? 0;
    totals.amount += log.amount ?? 0;
    return [
      index + 1, date, time,
      log.driver?.name,
      log.customer?.name ?? log.pointName,
      log.customer?.area,
      productLabel(toProductType(log.productType)),
      log.cansDelivered, log.casesDelivered, log.cansTakenBack, log.amount,
      paymentLabel(log.paymentStatus),
      log.vehicle ? [log.vehicle.name, log.vehicle.vehicleNumber].filter(Boolean).join(" - ") : null,
      blankToNull(log.notes),
      blankToNull(log.adminRemark),
    ];
  });
  const totalRow: CsvValue[] = ["Total", null, null, null, null, null, null, totals.cans, totals.cases, totals.takenBack, totals.amount];
  return [header, ...rows, [], totalRow];
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
  return [header, ...rows, [], ["Total", null, null, null, null, totalAmount]];
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

const RECENT_DAYS = 5;

export default function SuppliesPage() {
  const maxDate = todayInputValue();
  const maxMonth = currentMonthValue();
  const [supplyTab, setSupplyTab] = useState<"water" | "cash">("water");
  const [waterPage, setWaterPage] = useState(1);
  const [cashPage, setCashPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    date: "",
    month: "",
    driver: "",
    vehicle: "",
    customer: "",
    paymentStatus: "",
    productType: "",
  });
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<SupplyLog | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<SupplyLog | null>(null);
  const [editingAmount, setEditingAmount] = useState("");
  const [editingRemark, setEditingRemark] = useState("");
  const [editingCashType, setEditingCashType] = useState<"debit" | "fuel">("debit");
  const [editingDriverRemark, setEditingDriverRemark] = useState("");
  const [editingCansDelivered, setEditingCansDelivered] = useState("");
  const [editingCansTakenBack, setEditingCansTakenBack] = useState("");
  const [editingProductType, setEditingProductType] = useState<ProductType>("can");
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<"cash" | "upi" | "not_paid">("cash");
  const [editSaving, setEditSaving] = useState(false);
  const [sheetDownloading, setSheetDownloading] = useState(false);
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveSheetLink, setDriveSheetLink] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [confirmDeleteLog, setConfirmDeleteLog] = useState<SupplyLog | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({
    driverId: "",
    customerId: "",
    suppliedAt: todayInputValue(),
    productType: "can" as ProductType,
    // Quantity of the chosen product (cans or cases).
    cansDelivered: "",
    cansTakenBack: "",
    amount: "",
    notes: "",
  });
  const [addError, setAddError] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const { data: driverOptions } = useAdminDrivers();
  const { data: customerOptions } = useAdminCustomers();

  // With no filters, page 1 is the last RECENT_DAYS days and Next/Prev walk
  // older records. Any filter switches to normal unlimited pagination. The
  // product filter is left out: it narrows within the same window, so the
  // Cans and Cases totals add up to the unfiltered ones.
  const hasAnyFilter = Boolean(
    filters.date || filters.month || filters.driver || filters.vehicle || filters.customer || filters.paymentStatus,
  );
  const queryFilters = hasAnyFilter ? filters : { ...filters, days: RECENT_DAYS };

  // Only the visible tab's query runs; the other tab fetches when opened.
  // This halves the load on page open and after every add/edit/delete.
  const {
    data: queriedLogs,
    isLoading: logsLoading,
    isError: logsError,
  } = useAdminAddedSupplies(queryFilters, waterPage, { enabled: supplyTab === "water" });
  const {
    data: queriedCashLogs,
    isLoading: cashLogsLoading,
    isError: cashLogsError,
  } = useAdminCashCredits(queryFilters, cashPage, { enabled: supplyTab === "cash" });
  const queryClient = useAdminQueryClient();

  async function downloadImageToDevice(imageUrl?: string | null) {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to download image.");
      }

      const blob = await response.blob();
      const extension = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `fuel-bill-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
      setError("Couldn't start the download automatically. The image was opened in a new tab.");
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setWaterPage(1);
    setCashPage(1);
  }, [filters]);

  const loading = supplyTab === "water" ? logsLoading : cashLogsLoading;
  const fetchError = supplyTab === "water"
    ? (logsError ? "Failed to fetch water supplies." : "")
    : (cashLogsError ? "Failed to fetch cash credits." : "");

  const activeData: PaginatedSupplyLogsWithStats | undefined = supplyTab === "water" ? queriedLogs : queriedCashLogs;
  const effectiveLogs = useMemo(() => activeData?.logs ?? [], [activeData]);
  const totalPages = activeData?.totalPages ?? 1;
  const currentPage = supplyTab === "water" ? waterPage : cashPage;

  const groupedLogs = useMemo(() => {
    const groups = new Map<string, SupplyLog[]>();
    for (const log of effectiveLogs) {
      const key = new Date(log.suppliedAt).toDateString();
      const current = groups.get(key) ?? [];
      current.push(log);
      groups.set(key, current);
    }

    // Serial numbers restart at 1 for each day, following the displayed
    // latest-first order (top row of every day group is 1).
    return Array.from(groups.entries())
      .map(([key, entries]) => {
        const firstDate = entries[0]?.suppliedAt ?? new Date();
        return {
          key,
          label: getRelativeDayLabel(firstDate),
          dateSortValue: new Date(firstDate).getTime(),
          entries: entries.map((entry, index) => ({
            ...entry,
            serialNo: index + 1,
          })),
        };
      })
      .sort((a, b) => b.dateSortValue - a.dateSortValue);
  }, [effectiveLogs]);

  const summary = useMemo(() => {
    const s = activeData?.stats;
    return {
      total: activeData?.total ?? 0,
      uniqueDrivers: s?.uniqueDrivers ?? 0,
      uniqueCustomers: s?.uniqueCustomers ?? 0,
      totalCans: s?.totalCans ?? 0,
      totalCansTakenBack: s?.totalCansTakenBack ?? 0,
      totalCases: s?.totalCases ?? 0,
      totalAmount: s?.totalAmount ?? 0,
    };
  }, [activeData]);

  function exportDatePart() {
    return filters.date || filters.month || new Date().toISOString().slice(0, 10);
  }

  function exportFilenameBase() {
    return supplyTab === "water" ? `water-supplies-${exportDatePart()}` : `cash-credits-${exportDatePart()}`;
  }

  function exportRows() {
    return effectiveLogs.map<ExportRow>((log, index) => ({
      no: index + 1,
      dateTime: formatDateTime(log.suppliedAt),
      driver: `${log.driver?.name ?? ""} (@${log.driver?.username ?? ""})`,
      customer: log.customer?.name ?? log.pointName ?? "-",
      cans: log.cansDelivered !== undefined ? String(log.cansDelivered) : "-",
      cases: log.casesDelivered !== undefined ? String(log.casesDelivered) : "-",
      cansTakenBack: log.cansTakenBack !== undefined ? String(log.cansTakenBack) : "-",
      vehicle: `${log.vehicle?.name ?? ""} - ${log.vehicle?.vehicleNumber ?? ""}`,
      amount: log.amount !== undefined ? String(log.amount) : "-",
      cashType: log.cashType ?? "-",
      note: log.notes?.trim() ? log.notes : "-",
      remark: log.adminRemark?.trim() ? log.adminRemark : "-",
    }));
  }

  function exportTotals() {
    return effectiveLogs.reduce(
      (acc, log) => {
        acc.amount += log.amount ?? 0;
        acc.cans += log.cansDelivered ?? 0;
        acc.cases += log.casesDelivered ?? 0;
        acc.takenBack += log.cansTakenBack ?? 0;
        return acc;
      },
      { amount: 0, cans: 0, cases: 0, takenBack: 0 },
    );
  }

  function triggerDownload(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openReportWindowAndPrint() {
    const rows = exportRows();
    const totals = exportTotals();
    const reportWindow = window.open("", "_blank", "width=1200,height=800");
    if (!reportWindow) return null;
    const isCashTab = supplyTab === "cash";
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
          <th>Taken Back</th>
          <th>Amount</th>
          <th>Admin Remark</th>
        </tr>`;
    const tableRows = rows
      .map(
        (r) => isCashTab
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
          <td>${escapeHtml(r.cansTakenBack ?? "-")}</td>
          <td>${escapeHtml(r.amount)}</td>
          <td>${escapeHtml(r.remark)}</td>
        </tr>`
      )
      .join("");
    const footerRow = isCashTab
      ? `<tr>
          <td colspan="4">Total</td>
          <td>${totals.amount.toLocaleString("en-IN")}</td>
          <td colspan="2"></td>
        </tr>`
      : `<tr>
          <td colspan="4">Total</td>
          <td>${totals.cans}</td>
          <td>${totals.cases}</td>
          <td>${totals.takenBack}</td>
          <td>${totals.amount.toLocaleString("en-IN")}</td>
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
          <div class="meta">Generated: ${formatDateTime(new Date())} | Total Rows: ${rows.length} | <span style="font-weight:700;">Total Amount: ${totals.amount.toLocaleString("en-IN")}</span></div>
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
    return reportWindow;
  }

  async function handleDownloadImage() {
    const MAX_EXPORT_ROWS = 250;
    if (effectiveLogs.length > MAX_EXPORT_ROWS) {
      window.alert(
        `Too many rows to export at once on this device. Showing first ${MAX_EXPORT_ROWS} rows in the image.`,
      );
    }

    const rows = exportRows().slice(0, MAX_EXPORT_ROWS);
    const totals = exportTotals();
    const isCashTab = supplyTab === "cash";
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
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) return;
    const measure = measureCtx;
    measure.font = "12px Arial";

    function wrapText(value: string, maxWidth: number) {
      const words = value.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (measure.measureText(candidate).width <= maxWidth) {
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
      const cellLines = columns.map((col) => {
        const text = String(row[col.key] ?? "");
        return wrapText(text, col.width - cellPaddingX * 2);
      });
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
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 24px Arial";
    ctx.fillText(reportTitle, outerPadding, outerPadding + 24);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#334155";
    ctx.fillText(`Generated: ${formatDateTime(new Date())}`, outerPadding, outerPadding + 48);
    ctx.font = "700 14px Arial";
    ctx.fillText(`Total Amount: ${totals.amount.toLocaleString("en-IN")}`, outerPadding, outerPadding + 68);

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
      ? { no: "Total", amount: totals.amount.toLocaleString("en-IN") }
      : {
          no: "Total",
          cans: String(totals.cans),
          cases: String(totals.cases),
          cansTakenBack: String(totals.takenBack),
          amount: totals.amount.toLocaleString("en-IN"),
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

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      triggerDownload(`${exportFilenameBase()}.png`, pngBlob);
    }, "image/png");
  }

  // Unlike Photo and PDF (the rows on screen), the sheet holds every entry
  // matching the filters, so it matches the summary totals. With no filters
  // that is the last RECENT_DAYS days.
  async function handleDownloadSheet() {
    setSheetDownloading(true);
    setError("");
    try {
      const logs = await fetchAllSupplies(supplyTab, queryFilters);
      const csv = toCsv(supplyTab === "water" ? deliverySheetRows(logs) : cashSheetRows(logs));
      triggerDownload(`${exportFilenameBase()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
    } catch {
      setError("Couldn't prepare the sheet. Please try again.");
    } finally {
      setSheetDownloading(false);
    }
  }

  // Preload Google's sign-in script so the popup opens straight from the click.
  useEffect(() => {
    if (googleClientId) void loadGoogleIdentity().catch(() => undefined);
  }, []);

  // Same rows as Download Sheet, saved into the admin's Google Drive as a
  // Google Sheet.
  async function handleSaveToDrive() {
    setError("");
    setDriveSheetLink(null);
    if (!googleClientId) {
      setError("Saving to Google Drive isn't set up yet: add NEXT_PUBLIC_GOOGLE_CLIENT_ID (see the README).");
      return;
    }
    setDriveSaving(true);
    try {
      await loadGoogleIdentity();
      const token = await requestDriveToken();
      const logs = await fetchAllSupplies(supplyTab, queryFilters);
      const csv = toCsv(supplyTab === "water" ? deliverySheetRows(logs) : cashSheetRows(logs), { bom: false });
      const now = new Date();
      const savedAt = `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
      const title = `Royal King ${supplyTab === "water" ? "Water Supplies" : "Cash Credits"} ${exportDatePart()} (saved ${savedAt})`;
      const file = await saveCsvAsGoogleSheet(token, title, csv);
      setDriveSheetLink(file.webViewLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save to Google Drive. Please try again.");
    } finally {
      setDriveSaving(false);
    }
  }

  function handleDownloadPdf() {
    openReportWindowAndPrint();
  }

  function clearFilters() {
    setFilters({ date: "", month: "", driver: "", vehicle: "", customer: "", paymentStatus: "", productType: "" });
  }

  function openAddForm() {
    setAddData({
      driverId: "",
      customerId: "",
      suppliedAt: todayInputValue(),
      productType: "can",
      cansDelivered: "",
      cansTakenBack: "",
      amount: "",
      notes: "",
    });
    setAddError("");
    setShowAddForm(true);
  }

  async function handleAddDelivery() {
    setAddError("");
    if (!addData.driverId) { setAddError("Please select a driver."); return; }
    if (!addData.customerId) { setAddError("Please select a customer."); return; }
    if (!addData.suppliedAt) { setAddError("Please enter a delivery date."); return; }
    const quantities = formQuantities(addData.productType, addData.cansDelivered, addData.cansTakenBack);
    const quantityError = validateDeliveryQuantities(quantities);
    if (quantityError) {
      setAddError(quantityError);
      return;
    }
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/admin/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logType: "water",
          driverId: addData.driverId,
          customerId: addData.customerId,
          suppliedAt: addData.suppliedAt,
          ...quantities,
          amount: addData.amount !== "" ? Number(addData.amount) : undefined,
          notes: addData.notes || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      setAddSubmitting(false);
      if (!res.ok) { setAddError(data.error ?? "Failed to create delivery."); return; }
      setShowAddForm(false);
      // Fire-and-forget: the visible list refetches in the background while
      // keepPreviousData keeps the current rows on screen.
      void queryClient.invalidateQueries({ queryKey: ["admin", "supplies"] });
    } catch {
      setAddSubmitting(false);
      setAddError("Failed to create delivery.");
    }
  }

  function openEditModal(log: SupplyLog) {
    setEditingLog(log);
    setEditingAmount(log.amount !== undefined ? String(log.amount) : "");
    setEditingRemark(log.adminRemark ?? "");
    setEditingCashType(log.cashType === "fuel" ? "fuel" : "debit");
    setEditingDriverRemark(log.notes ?? "");
    setEditingProductType(toProductType(log.productType));
    const quantity = deliveredQuantity(log);
    setEditingCansDelivered(quantity !== undefined ? String(quantity) : "");
    setEditingCansTakenBack(log.cansTakenBack !== undefined ? String(log.cansTakenBack) : "");
    const ps = log.paymentStatus;
    setEditingPaymentStatus(ps === "upi" || ps === "not_paid" ? ps : "cash");
    setError("");
  }

  async function saveEdit() {
    if (!editingLog) return;
    if (editingLog.logType === "cash" && (!editingAmount || Number(editingAmount) < 0)) {
      setError("Please enter a valid amount.");
      return;
    }
    const quantities = formQuantities(editingProductType, editingCansDelivered, editingCansTakenBack);
    if (editingLog.logType !== "cash") {
      // Switching product needs the new quantity; a plain edit may leave it blank.
      const switching = editingProductType !== toProductType(editingLog.productType);
      const quantityError = validateDeliveryQuantities(quantities, { partial: !switching });
      if (quantityError) {
        setError(quantityError);
        return;
      }
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/supplies/${editingLog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingLog.logType === "cash"
            ? {
                amount: Number(editingAmount),
                adminRemark: editingRemark,
                cashType: editingCashType,
                notes: editingDriverRemark,
              }
            : {
                // Always carries productType, so older rows get it recorded on save.
                ...quantities,
                notes: editingDriverRemark,
                adminRemark: editingRemark,
                paymentStatus: editingPaymentStatus,
              }
        ),
      });
      setEditSaving(false);

      const data = (await res.json().catch(() => ({}))) as SupplyLog & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to update. Please try again.");
        return;
      }

      const updated = data;
      const updatedWithFormatted = {
        ...updated,
        formattedSuppliedAt: updated.formattedSuppliedAt ?? formatDateTime(updated.suppliedAt),
      };

      // Refetch rather than patch the row in place: quantity and product
      // changes also move the summary totals, which come from the server.
      void queryClient.invalidateQueries({ queryKey: ["admin", "supplies"] });
      setSelectedLog((prev) => prev && prev._id === updated._id ? updatedWithFormatted : prev);
      setEditingLog(null);
    } catch {
      setEditSaving(false);
      setError("Failed to update. Please try again.");
    }
  }

  async function doDeleteSupplyLog() {
    if (!confirmDeleteLog) return;
    const log = confirmDeleteLog;
    setConfirmDeleteLog(null);
    setDeleteSaving(true);
    try {
      const res = await fetch(`/api/admin/supplies/${log._id}`, { method: "DELETE" });
      setDeleteSaving(false);
      if (!res.ok) {
        setError("Failed to delete supply log.");
        return;
      }
      setSelectedLog(null);
      setEditingLog(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "supplies"] });
    } catch {
      setDeleteSaving(false);
      setError("Failed to delete supply log. Please try again.");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
          <h1>Deliveries</h1>
          <div
            style={{
              marginTop: "0.75rem",
              background: "#eef2f7",
              borderRadius: "14px",
              padding: "0.35rem",
              display: "flex",
              gap: "0.35rem",
              width: "clamp(320px, 85vw, 1200px)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", minWidth: 0, width: "100%", gap: "0.35rem" }}>
              <button
                type="button"
                onClick={() => setSupplyTab("water")}
                style={{
                  borderTop: "0",
                  borderRight: "0",
                  borderBottom: "0",
                  borderLeft: "0",
                  borderRadius: "12px",
                  background: supplyTab === "water" ? "var(--accent-primary)" : "#f3f4f6",
                  padding: "0.65rem 0.9rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  color: supplyTab === "water" ? "#ffffff" : "#111827",
                  flex: 1,
                }}
              >
                Deliveries
              </button>
              <button
                type="button"
                onClick={() => setSupplyTab("cash")}
                style={{
                  borderTop: "0",
                  borderRight: "0",
                  borderBottom: "0",
                  borderLeft: "0",
                  borderRadius: "12px",
                  background: supplyTab === "cash" ? "var(--accent-primary)" : "#f3f4f6",
                  padding: "0.65rem 0.9rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  color: supplyTab === "cash" ? "#ffffff" : "#111827",
                  flex: 1,
                }}
              >
                Cash Credits
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem", alignItems: "center" }}>
            {supplyTab === "water" && (
              <button type="button" className="btn btn-primary btn-sm" onClick={openAddForm}>
                + Add Delivery
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleDownloadImage()}>
              Download Photo
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadPdf}>
              Download PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleDownloadSheet()}
              disabled={sheetDownloading}
              title="Spreadsheet (.csv) of every entry matching the filters. Opens in Google Sheets or Excel."
            >
              {sheetDownloading ? "Preparing..." : "Download Sheet"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleSaveToDrive()}
              disabled={driveSaving}
              title="Save every entry matching the filters as a Google Sheet in your Google Drive."
            >
              {driveSaving ? "Saving to Drive..." : "Save to Google Drive"}
            </button>
          </div>
          {driveSheetLink && (
            <div className="alert alert-success" style={{ marginTop: "0.75rem" }}>
              Saved to your Google Drive.{" "}
              <a href={driveSheetLink} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, textDecoration: "underline" }}>
                Open the sheet
              </a>
            </div>
          )}
        </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="grid-3" style={{ marginBottom: "0.75rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="filterDate">Date</label>
            <input
              id="filterDate"
              type="date"
              className="form-input"
              value={filters.date}
              max={maxDate}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  date: e.target.value,
                  month: e.target.value ? "" : f.month,
                }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="filterMonth">Month</label>
            <input
              id="filterMonth"
              type="month"
              className="form-input"
              value={filters.month}
              max={maxMonth}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  month: e.target.value,
                  date: e.target.value ? "" : f.date,
                }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="filterDriver">Driver</label>
            <select
              id="filterDriver"
              className="form-select"
              value={filters.driver}
              onChange={(e) => setFilters((f) => ({ ...f, driver: e.target.value }))}
            >
              <option value="">All Drivers</option>
              {(driverOptions ?? []).map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} (@{driver.username})
                </option>
              ))}
            </select>
          </div>
          {supplyTab === "water" && (
            <div className="form-group">
              <label className="form-label" htmlFor="filterCustomer">Customer</label>
              <select
                id="filterCustomer"
                className="form-select"
                value={filters.customer}
                onChange={(e) => setFilters((f) => ({ ...f, customer: e.target.value }))}
              >
                <option value="">All Customers</option>
                {(customerOptions ?? [])
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.area ? ` - ${c.area}` : ""}{c.isActive ? "" : " (inactive)"}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {supplyTab === "water" && (
            <div className="form-group">
              <label className="form-label" htmlFor="filterPaymentStatus">Payment Method</label>
              <select
                id="filterPaymentStatus"
                className="form-select"
                value={filters.paymentStatus}
                onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value as Filters["paymentStatus"] }))}
              >
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="not_paid">Not Paid</option>
              </select>
            </div>
          )}
          {supplyTab === "water" && (
            <div className="form-group">
              <label className="form-label" htmlFor="filterProductType">Product</label>
              <select
                id="filterProductType"
                className="form-select"
                value={filters.productType}
                onChange={(e) => setFilters((f) => ({ ...f, productType: e.target.value as Filters["productType"] }))}
              >
                <option value="">All Products</option>
                <option value="can">Cans</option>
                <option value="case">Cases</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "end" }}>
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          padding: "0.65rem 0.9rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          display: "flex",
          gap: "0.9rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span><strong style={{ color: "var(--text-primary)" }}>Total:</strong> {summary.total}</span>
        <span><strong style={{ color: "var(--text-primary)" }}>Drivers:</strong> {summary.uniqueDrivers}</span>
        {supplyTab === "water" && (
          <>
            <span><strong style={{ color: "var(--text-primary)" }}>Customers:</strong> {summary.uniqueCustomers}</span>
            <span><strong style={{ color: "var(--text-primary)" }}>Cans Del.:</strong> {summary.totalCans}</span>
            <span><strong style={{ color: "var(--text-primary)" }}>Cases Del.:</strong> {summary.totalCases}</span>
            <span><strong style={{ color: "var(--text-primary)" }}>Taken Back:</strong> {summary.totalCansTakenBack}</span>
          </>
        )}
        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Total Amount: {summary.totalAmount.toLocaleString("en-IN")}
        </span>
        {!hasAnyFilter && (
          <span style={{ marginLeft: "auto" }}>
            {currentPage === 1 ? `Last ${RECENT_DAYS} days` : "Older records"}
          </span>
        )}
      </div>

      {(error || fetchError) && <div className="alert alert-error">{error || fetchError}</div>}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>
          {supplyTab === "water" ? "Loading water supplies..." : "Loading cash credits..."}
        </p>
      ) : effectiveLogs.length === 0 ? (
        <div className="card empty-state">
          {hasAnyFilter
            ? supplyTab === "water"
              ? "No water supplies for selected filters."
              : "No cash credits for selected filters."
            : `No ${supplyTab === "water" ? "water supplies" : "cash credits"} in the last ${RECENT_DAYS} days.${totalPages > 1 ? " Use Next below to view older records." : ""}`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {groupedLogs.map((group) => (
            <div key={group.key} className="log-group">
              <div className="flex items-center justify-between" style={{ marginBottom: "0.55rem" }}>
                <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>{group.label}</h3>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      {supplyTab === "water" ? <th>Customer</th> : <th>Amount</th>}
                      {supplyTab === "water" ? <th>Qty</th> : <th>Type</th>}
                      {supplyTab === "water" && <th>Amount</th>}
                      <th>Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((log) => (
                      <tr key={log._id} className={driverNote(log) ? "supply-row-noted" : undefined}>
                        <td
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedLog(log)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedLog(log);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {log.serialNo}
                        </td>
                        <td
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedLog(log)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedLog(log);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {supplyTab === "water"
                            ? maskText(log.customer?.name ?? log.pointName ?? "-")
                            : (log.amount !== undefined ? log.amount : "-")}
                          {driverNote(log) && <NotePreview note={driverNote(log)} />}
                        </td>
                        <td
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedLog(log)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedLog(log);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {supplyTab === "water" ? (
                            <div>
                              <strong>{deliveredQuantity(log) ?? "-"}</strong>
                              <div style={{ marginTop: "0.15rem" }}><ProductPill productType={log.productType} size="sm" /></div>
                              {log.cansTakenBack !== undefined && (
                                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>↩ {log.cansTakenBack}</div>
                              )}
                            </div>
                          ) : log.cashType === "fuel" ? (
                            log.billImageUrl ? (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedImageUrl(log.billImageUrl ?? null);
                                }}
                                style={{ width: "fit-content" }}
                              >
                                Fuel
                              </button>
                            ) : (
                              <span style={{ fontWeight: 600 }}>Fuel</span>
                            )
                          ) : (
                            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
                              {log.cashType ?? "-"}
                            </span>
                          )}
                        </td>
                        {supplyTab === "water" && (
                          <td
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedLog(log)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedLog(log);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <div>{log.amount !== undefined ? log.amount : "-"}</div>
                            {(() => {
                              const ps = log.paymentStatus;
                              const label = !ps || ps === "cash" ? "Cash" : ps === "upi" ? "UPI" : "Not Paid";
                              const bg = !ps || ps === "cash" ? "#e8f5e9" : ps === "upi" ? "#e3f2fd" : "#fff3e0";
                              const color = !ps || ps === "cash" ? "#2e7d32" : ps === "upi" ? "#1565c0" : "#e65100";
                              return (
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "99px", background: bg, color }}>
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                        )}
                        <td
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedLog(log)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedLog(log);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <div style={{ fontWeight: 600 }}>{log.driver?.name ? maskText(log.driver.name) : "-"}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (totalPages > 1 || currentPage > 1) && (
        <div className="flex items-center justify-between" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() =>
              supplyTab === "water"
                ? setWaterPage((page) => Math.max(1, page - 1))
                : setCashPage((page) => Math.max(1, page - 1))
            }
          >
            Prev
          </button>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Page {currentPage} of {totalPages}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() =>
              supplyTab === "water"
                ? setWaterPage((page) => Math.min(totalPages, page + 1))
                : setCashPage((page) => Math.min(totalPages, page + 1))
            }
          >
            Next
          </button>
        </div>
      )}

      {showAddForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 250 }}
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Add Delivery</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddForm(false)}>Close</button>
            </div>

            <div className="grid-2" style={{ marginBottom: "1rem" }}>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="addSuppliedAt">Delivery Date *</label>
                <input
                  id="addSuppliedAt"
                  className="form-input"
                  type="date"
                  max={todayInputValue()}
                  value={addData.suppliedAt}
                  onChange={(e) => setAddData((d) => ({ ...d, suppliedAt: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="addDriver">Driver *</label>
                <select
                  id="addDriver"
                  className="form-select"
                  value={addData.driverId}
                  onChange={(e) => setAddData((d) => ({ ...d, driverId: e.target.value }))}
                >
                  <option value="">Select Driver</option>
                  {(driverOptions ?? []).map((dr) => (
                    <option key={dr._id} value={dr._id}>{dr.name} (@{dr.username})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="addCustomer">Customer *</label>
                <select
                  id="addCustomer"
                  className="form-select"
                  value={addData.customerId}
                  onChange={(e) => setAddData((d) => ({ ...d, customerId: e.target.value }))}
                >
                  <option value="">Select Customer</option>
                  {(customerOptions ?? []).filter((c) => c.isActive).map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.area ? ` — ${c.area}` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Product *</label>
                <ProductRadios
                  name="addProductType"
                  value={addData.productType}
                  onChange={(pt) => setAddData((d) => ({ ...d, productType: pt, cansDelivered: "", cansTakenBack: "" }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="addCansDelivered">{addData.productType === "case" ? "Cases Delivered" : "Cans Delivered"}</label>
                <input
                  id="addCansDelivered"
                  className="form-input"
                  type="number"
                  min={addData.productType === "case" ? "1" : "0"}
                  step="1"
                  placeholder={addData.productType === "case" ? "e.g. 1" : "e.g. 2"}
                  value={addData.cansDelivered}
                  onChange={(e) => setAddData((d) => ({ ...d, cansDelivered: e.target.value }))}
                />
              </div>

              {addData.productType === "can" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="addCansTakenBack">Cans Taken Back</label>
                  <input
                    id="addCansTakenBack"
                    className="form-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 0"
                    value={addData.cansTakenBack}
                    onChange={(e) => setAddData((d) => ({ ...d, cansTakenBack: e.target.value }))}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="addAmount">Amount (₹) — auto-calculated if blank</label>
                <input
                  id="addAmount"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave blank to auto-calculate"
                  value={addData.amount}
                  onChange={(e) => setAddData((d) => ({ ...d, amount: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="addNotes">Notes (Optional)</label>
                <input
                  id="addNotes"
                  className="form-input"
                  placeholder="Optional notes"
                  value={addData.notes}
                  onChange={(e) => setAddData((d) => ({ ...d, notes: e.target.value }))}
                />
              </div>
            </div>

            {addError && <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>{addError}</div>}

            <button
              type="button"
              className="btn btn-primary"
              disabled={addSubmitting}
              onClick={() => void handleAddDelivery()}
            >
              {addSubmitting ? "Saving..." : "Add Delivery"}
            </button>
          </div>
        </div>
      )}

      {selectedLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 250,
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Supply Details</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
            <div className="flex-col gap-2">
              <div>
                <div className="text-sm text-muted">Date & Time</div>
                <div style={{ fontWeight: 600 }}>{formatDateTime(selectedLog.suppliedAt)}</div>
              </div>
              {selectedLog.driver?.name && (
                <div>
                  <div className="text-sm text-muted">Driver</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.driver.name}</div>
                </div>
              )}
              {(selectedLog.customer?.name || selectedLog.pointName) && (
                <div>
                  <div className="text-sm text-muted">Customer</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedLog.customer?.name ?? selectedLog.pointName}
                    {selectedLog.customer?._id && (
                      <Link
                        href={`/admin/customers/${selectedLog.customer._id}`}
                        style={{ marginLeft: "0.6rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-primary)" }}
                      >
                        View History
                      </Link>
                    )}
                  </div>
                  {selectedLog.customer?.area && (
                    <div className="text-sm text-muted">{selectedLog.customer.area}</div>
                  )}
                </div>
              )}
              {selectedLog.logType !== "cash" && (
                <div>
                  <div className="text-sm text-muted">Product</div>
                  <ProductPill productType={selectedLog.productType} />
                </div>
              )}
              {deliveredQuantity(selectedLog) !== undefined && (
                <div>
                  <div className="text-sm text-muted">
                    {toProductType(selectedLog.productType) === "case" ? "Cases Delivered" : "Cans Delivered"}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{deliveredQuantity(selectedLog)}</div>
                </div>
              )}
              {selectedLog.cansTakenBack !== undefined && (
                <div>
                  <div className="text-sm text-muted">Cans Taken Back</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{selectedLog.cansTakenBack}</div>
                </div>
              )}
              {(selectedLog.vehicle?.name || selectedLog.vehicle?.vehicleNumber || selectedLog.vehicle?.capacity) && (
                <div>
                  <div className="text-sm text-muted">Vehicle</div>
                  {(selectedLog.vehicle?.name || selectedLog.vehicle?.vehicleNumber) && (
                    <div style={{ fontWeight: 600 }}>
                      {[selectedLog.vehicle?.name, selectedLog.vehicle?.vehicleNumber].filter(Boolean).join(" - ")}
                    </div>
                  )}
                  {selectedLog.vehicle?.capacity && (
                    <div className="text-sm text-muted">{selectedLog.vehicle.capacity}</div>
                  )}
                </div>
              )}
              {selectedLog.logType === "cash" && selectedLog.cashType && (
                <>
                  <div>
                    <div className="text-sm text-muted">Cash Type</div>
                    <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{selectedLog.cashType}</div>
                  </div>
                  {selectedLog.billImageUrl && (
                    <div>
                      <div className="text-sm text-muted">Fuel Bill Image</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => setExpandedImageUrl(selectedLog.billImageUrl ?? null)}
                          style={{
                            border: "0",
                            background: "transparent",
                            padding: 0,
                            cursor: "zoom-in",
                            width: "fit-content",
                          }}
                        >
                          <img
                            src={cloudinaryThumb(selectedLog.billImageUrl, 640)}
                            alt="Fuel bill uploaded by driver"
                            loading="lazy"
                            decoding="async"
                            style={{ width: "100%", maxWidth: "260px", borderRadius: "10px", border: "1px solid var(--border)" }}
                          />
                        </button>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setExpandedImageUrl(selectedLog.billImageUrl ?? null)}
                            style={{ width: "fit-content" }}
                          >
                            View detailed image
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => void downloadImageToDevice(selectedLog.billImageUrl)}
                            style={{ width: "fit-content" }}
                          >
                            Download image
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedLog.amount !== undefined && (
                <div>
                  <div className="text-sm text-muted">Amount</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.amount}</div>
                </div>
              )}
              {selectedLog.logType !== "cash" && (
                <div>
                  <div className="text-sm text-muted">Payment Status</div>
                  <div style={{
                    display: "inline-block", fontWeight: 700, fontSize: "0.82rem",
                    padding: "0.18rem 0.6rem", borderRadius: "99px",
                    background: !selectedLog.paymentStatus || selectedLog.paymentStatus === "cash" ? "#e8f5e9" : selectedLog.paymentStatus === "upi" ? "#e3f2fd" : "#fff3e0",
                    color: !selectedLog.paymentStatus || selectedLog.paymentStatus === "cash" ? "#2e7d32" : selectedLog.paymentStatus === "upi" ? "#1565c0" : "#e65100",
                  }}>
                    {!selectedLog.paymentStatus || selectedLog.paymentStatus === "cash" ? "Cash" : selectedLog.paymentStatus === "upi" ? "UPI" : "Not Paid"}
                  </div>
                </div>
              )}
              {selectedLog.adminRemark && (
                <div>
                  <div className="text-sm text-muted">Admin Remark</div>
                  <div style={{ fontWeight: 500 }}>{selectedLog.adminRemark}</div>
                </div>
              )}
              {selectedLog.notes && (
                <div>
                  <div className="text-sm text-muted">Driver Notes</div>
                  <div style={{ fontWeight: 500 }}>{selectedLog.notes}</div>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteSaving}
                onClick={() => setConfirmDeleteLog(selectedLog)}
              >
                {deleteSaving ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={deleteSaving}
                onClick={() => {
                  openEditModal(selectedLog);
                  setSelectedLog(null);
                }}
              >
                {selectedLog.logType === "cash" ? "Edit Cash Credit" : "Edit Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedImageUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 300,
          }}
          onClick={() => setExpandedImageUrl(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3>Fuel Bill Preview</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => void downloadImageToDevice(expandedImageUrl)}
                >
                  Download Image
                </button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setExpandedImageUrl(null)}>
                  Close
                </button>
              </div>
            </div>
            <img
              src={cloudinaryAuto(expandedImageUrl)}
              alt="Fuel bill detailed preview"
              decoding="async"
              style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "10px", border: "1px solid var(--border)" }}
            />
          </div>
        </div>
      )}

      {confirmDeleteLog && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 400 }}
          onClick={() => setConfirmDeleteLog(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "0.75rem" }}>Delete Log?</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Permanently delete the {confirmDeleteLog.logType === "cash" ? "cash credit" : "delivery"} log for{" "}
              <strong>{confirmDeleteLog.customer?.name ?? confirmDeleteLog.pointName ?? "this entry"}</strong>{" "}
              on {formatDateTime(confirmDeleteLog.suppliedAt)}? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDeleteLog(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={deleteSaving} onClick={() => void doDeleteSupplyLog()}>
                {deleteSaving ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 260,
          }}
          onClick={() => setEditingLog(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>{editingLog.logType === "cash" ? "Edit Cash Credit" : "Edit Delivery"}</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingLog(null)}>
                Close
              </button>
            </div>

            {editingLog.logType === "water" && (
              <>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label">Product</label>
                  <ProductRadios
                    name="editProductType"
                    value={editingProductType}
                    onChange={(pt) => {
                      setEditingProductType(pt);
                      if (pt === toProductType(editingLog.productType)) {
                        // Back on the saved product: restore the saved quantities.
                        const quantity = deliveredQuantity(editingLog);
                        setEditingCansDelivered(quantity !== undefined ? String(quantity) : "");
                        setEditingCansTakenBack(editingLog.cansTakenBack !== undefined ? String(editingLog.cansTakenBack) : "");
                      } else {
                        // A count entered for one product must never be saved as the other.
                        setEditingCansDelivered("");
                        setEditingCansTakenBack("");
                      }
                    }}
                  />
                  {editingProductType !== toProductType(editingLog.productType) && (
                    <div className="text-sm text-muted" style={{ marginTop: "0.3rem" }}>
                      Enter the {editingProductType === "case" ? "cases" : "cans"} delivered. The amount will be recalculated at the customer&apos;s {editingProductType} rate (cleared if none is set).
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label" htmlFor="editCansDelivered">{editingProductType === "case" ? "Cases Delivered" : "Cans Delivered"}</label>
                  <input
                    id="editCansDelivered"
                    className="form-input"
                    type="number"
                    min={editingProductType === "case" ? "1" : "0"}
                    step="1"
                    value={editingCansDelivered}
                    onChange={(e) => setEditingCansDelivered(e.target.value)}
                  />
                </div>
                {editingProductType === "can" && (
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label className="form-label" htmlFor="editCansTakenBack">Cans Taken Back</label>
                    <input
                      id="editCansTakenBack"
                      className="form-input"
                      type="number"
                      min="0"
                      step="1"
                      value={editingCansTakenBack}
                      onChange={(e) => setEditingCansTakenBack(e.target.value)}
                    />
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label">Payment Status</label>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                    {(["cash", "upi", "not_paid"] as const).map((ps) => (
                      <label key={ps} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: editingPaymentStatus === ps ? 700 : 500 }}>
                        <input
                          type="radio"
                          name="editPaymentStatus"
                          value={ps}
                          checked={editingPaymentStatus === ps}
                          onChange={() => setEditingPaymentStatus(ps)}
                        />
                        {ps === "cash" ? "Cash" : ps === "upi" ? "UPI" : "Not Paid"}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label" htmlFor="editDriverNote">Driver Notes (Optional)</label>
                  <input
                    id="editDriverNote"
                    className="form-input"
                    value={editingDriverRemark}
                    onChange={(e) => setEditingDriverRemark(e.target.value)}
                  />
                </div>
              </>
            )}

            {editingLog.logType === "cash" && (
              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label className="form-label" htmlFor="editAmount">Amount</label>
                <input
                  id="editAmount"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingAmount}
                  onChange={(e) => setEditingAmount(e.target.value)}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label className="form-label" htmlFor="editRemark">Admin Remark (Optional)</label>
              <input
                id="editRemark"
                className="form-input"
                value={editingRemark}
                onChange={(e) => setEditingRemark(e.target.value)}
              />
            </div>

            {editingLog.logType === "cash" && (
              <>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label" htmlFor="editCashType">Cash Type</label>
                  <select
                    id="editCashType"
                    className="form-select"
                    value={editingCashType}
                    onChange={(e) => setEditingCashType(e.target.value as "debit" | "fuel")}
                  >
                    <option value="debit">Debit</option>
                    <option value="fuel">Fuel</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label" htmlFor="editDriverRemark">Driver Remark (Optional)</label>
                  <input
                    id="editDriverRemark"
                    className="form-input"
                    value={editingDriverRemark}
                    onChange={(e) => setEditingDriverRemark(e.target.value)}
                  />
                </div>
              </>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>{error}</div>}

            <button type="button" className="btn btn-primary" disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
