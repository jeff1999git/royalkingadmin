"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import {
  useAdminAddedSupplies,
  useAdminCashCredits,
  useAdminDrivers,
  useAdminQueryClient,
} from "../../hooks/useAdminQueries";

interface DriverOption {
  _id: string;
  name: string;
  username: string;
}

interface SupplyLog {
  _id: string;
  suppliedAt: string;
  formattedSuppliedAt?: string;
  pointName?: string;
  notes?: string;
  amount?: number;
  logType?: "water" | "cash";
  cashType?: "debit" | "fuel";
  adminRemark?: string;
  billImageUrl?: string;
  billImagePublicId?: string;
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
  point?: string;
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

export default function SuppliesPage() {
  const GROUPS_PER_PAGE = 5;
  const maxDate = todayInputValue();
  const maxMonth = currentMonthValue();
  const [supplyTab, setSupplyTab] = useState<"water" | "cash">("water");
  const [waterPage, setWaterPage] = useState(1);
  const [cashPage, setCashPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    date: "",
    month: maxMonth,
    driver: "",
    vehicle: "",
  });
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<SupplyLog | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<SupplyLog | null>(null);
  const [editingAmount, setEditingAmount] = useState("");
  const [editingRemark, setEditingRemark] = useState("");
  const [editingCashType, setEditingCashType] = useState<"debit" | "fuel">("debit");
  const [editingDriverRemark, setEditingDriverRemark] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const { data: driverOptions } = useAdminDrivers();
  const {
    data: queriedLogs,
    isLoading: logsLoading,
    isError: logsError,
  } = useAdminAddedSupplies(filters);
  const {
    data: queriedCashLogs,
    isLoading: cashLogsLoading,
    isError: cashLogsError,
  } = useAdminCashCredits(filters);
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

  useEffect(() => {
    if (driverOptions) {
      setDrivers(driverOptions);
    }
  }, [driverOptions]);

  useEffect(() => {
    const isWater = supplyTab === "water";
    setLoading(isWater ? logsLoading : cashLogsLoading);
    if ((isWater && logsError) || (!isWater && cashLogsError)) {
      setError(isWater ? "Failed to fetch water supplies." : "Failed to fetch cash credits.");
      return;
    }
    if ((isWater && queriedLogs) || (!isWater && queriedCashLogs)) {
      setError("");
    }
  }, [cashLogsError, cashLogsLoading, logsError, logsLoading, queriedCashLogs, queriedLogs, supplyTab]);

  const effectiveLogs = useMemo(
    () => (supplyTab === "water" ? queriedLogs ?? [] : queriedCashLogs ?? []),
    [queriedCashLogs, queriedLogs, supplyTab],
  );

  const groupedLogs = useMemo(() => {
    const serialById = new Map(
      effectiveLogs.map((log, index) => [log._id, index + 1] as const),
    );
    const groups = new Map<string, SupplyLog[]>();
    for (const log of effectiveLogs) {
      const key = new Date(log.suppliedAt).toDateString();
      const current = groups.get(key) ?? [];
      current.push(log);
      groups.set(key, current);
    }

    return Array.from(groups.entries())
      .map(([key, entries]) => {
        const firstDate = entries[0]?.suppliedAt ?? new Date();
        return {
          key,
          label: getRelativeDayLabel(firstDate),
          dateSortValue: new Date(firstDate).getTime(),
          entries: entries.map((entry) => ({
            ...entry,
            serialNo: serialById.get(entry._id) ?? 0,
          })),
        };
      })
      .sort((a, b) => b.dateSortValue - a.dateSortValue);
  }, [effectiveLogs]);

  const totalPages = Math.max(1, Math.ceil(groupedLogs.length / GROUPS_PER_PAGE));
  const currentPage = supplyTab === "water" ? waterPage : cashPage;
  const pagedGroupedLogs = useMemo(() => {
    const start = (currentPage - 1) * GROUPS_PER_PAGE;
    return groupedLogs.slice(start, start + GROUPS_PER_PAGE);
  }, [currentPage, groupedLogs]);

  useEffect(() => {
    if (supplyTab === "water") {
      setWaterPage((current) => Math.min(current, totalPages));
    } else {
      setCashPage((current) => Math.min(current, totalPages));
    }
  }, [supplyTab, totalPages]);

  const summary = useMemo(() => {
    const totalAmount = effectiveLogs.reduce(
      (sum, log) => sum + (log.amount ?? 0),
      0,
    );
    return {
      total: effectiveLogs.length,
      uniqueDrivers: new Set(
        effectiveLogs.map((l) => l.driver?._id ?? ""),
      ).size,
      uniqueVehicles: new Set(
        effectiveLogs.map((l) => l.vehicle?._id ?? ""),
      ).size,
      totalAmount,
    };
  }, [effectiveLogs]);

  function exportFilenameBase() {
    const datePart = filters.date || filters.month || new Date().toISOString().slice(0, 10);
    return supplyTab === "water" ? `water-supplies-${datePart}` : `cash-credits-${datePart}`;
  }

  function exportRows() {
    return effectiveLogs.map<ExportRow>((log, index) => ({
      no: index + 1,
      dateTime: formatDateTime(log.suppliedAt),
      driver: `${log.driver?.name ?? ""} (@${log.driver?.username ?? ""})`,
      point: log.pointName ?? "-",
      vehicle: `${log.vehicle?.name ?? ""} - ${log.vehicle?.vehicleNumber ?? ""}`,
      amount: log.amount !== undefined ? String(log.amount) : "-",
      cashType: log.cashType ?? "-",
      note: log.notes?.trim() ? log.notes : "-",
      remark: log.adminRemark?.trim() ? log.adminRemark : "-",
    }));
  }

  function exportTotalAmount() {
    return effectiveLogs.reduce((sum, log) => sum + (log.amount ?? 0), 0);
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
    const totalAmount = exportTotalAmount();
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
          <th>Point</th>
          <th>Vehicle</th>
          <th>Amount</th>
          <th>Admin Remark</th>
        </tr>`;
    const tableRows = rows
      .map(
        (r) => `<tr>
          <td>${r.no}</td>
          <td>${r.dateTime}</td>
          <td>${r.driver}</td>
          <td>${isCashTab ? r.cashType : r.point}</td>
          <td>${isCashTab ? r.amount : r.vehicle}</td>
          <td>${isCashTab ? r.note : r.amount}</td>
          <td>${r.remark}</td>
        </tr>`
      )
      .join("");
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
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <div class="meta">Generated: ${formatDateTime(new Date())} | Total Rows: ${rows.length} | <span style="font-weight:700;">Total Amount: ${totalAmount.toLocaleString("en-IN")}</span></div>
          <table>
            <thead>
              ${headerRow}
            </thead>
            <tbody>${tableRows}</tbody>
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
    const totalAmount = exportTotalAmount();
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
          { key: "point", title: "Point", width: 280 },
          { key: "vehicle", title: "Vehicle", width: 260 },
          { key: "amount", title: "Amount", width: 120 },
          { key: "remark", title: "Admin Remark", width: 280 },
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

    const tableHeight = headerHeight + rowLayouts.reduce((sum, r) => sum + r.rowHeight, 0);
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
    ctx.fillText(`Total Amount: ${totalAmount.toLocaleString("en-IN")}`, outerPadding, outerPadding + 68);

    const tableX = outerPadding;
    let y = outerPadding + titleHeight;

    ctx.fillStyle = "#f5f7fb";
    ctx.fillRect(tableX, y, tableWidth, headerHeight);
    ctx.strokeStyle = "#cfd8e3";
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, y, tableWidth, headerHeight);

    let x = tableX;
    ctx.font = "700 12px Arial";
    ctx.fillStyle = "#111827";
    for (const col of columns) {
      ctx.fillText(col.title, x + cellPaddingX, y + 22);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + headerHeight + rowLayouts.reduce((sum, r) => sum + r.rowHeight, 0));
      ctx.stroke();
      x += col.width;
    }
    ctx.beginPath();
    ctx.moveTo(tableX + tableWidth, y);
    ctx.lineTo(tableX + tableWidth, y + headerHeight + rowLayouts.reduce((sum, r) => sum + r.rowHeight, 0));
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

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      triggerDownload(`${exportFilenameBase()}.png`, pngBlob);
    }, "image/png");
  }

  function handleDownloadPdf() {
    openReportWindowAndPrint();
  }

  function clearFilters() {
    setFilters({ date: "", month: maxMonth, driver: "", vehicle: "" });
  }

  function openEditModal(log: SupplyLog) {
    setEditingLog(log);
    setEditingAmount(log.amount !== undefined ? String(log.amount) : "");
    setEditingRemark(log.adminRemark ?? "");
    setEditingCashType(log.cashType === "fuel" ? "fuel" : "debit");
    setEditingDriverRemark(log.notes ?? "");
    setError("");
  }

  async function saveEdit() {
    if (!editingLog) return;
    if (!editingAmount || Number(editingAmount) < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setEditSaving(true);
    const res = await fetch(`/api/admin/supplies/${editingLog._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(editingAmount),
        adminRemark: editingRemark,
        ...(editingLog.logType === "cash"
          ? {
              cashType: editingCashType,
              notes: editingDriverRemark,
            }
          : {}),
      }),
    });
    setEditSaving(false);

    if (!res.ok) {
      setError("Failed to update amount.");
      return;
    }

    const updated = (await res.json()) as SupplyLog;
    // Update the cached query data so lists and modals reflect the changes.
    const updatedWithFormatted = {
      ...updated,
      formattedSuppliedAt:
        updated.formattedSuppliedAt ??
        formatDateTime(updated.suppliedAt),
    };

    const listQueryKey =
      editingLog.logType === "cash"
        ? ["admin", "supplies", "cash-credits", filters]
        : ["admin", "supplies", "added", filters];

    queryClient.setQueryData<SupplyLog[]>(
      listQueryKey,
      (prev) =>
        prev?.map((log) =>
          log._id === updated._id ? updatedWithFormatted : log,
        ) ?? prev,
    );
    setSelectedLog((prev) =>
      prev && prev._id === updated._id
        ? updatedWithFormatted
        : prev,
    );
    setEditingLog(null);
  }

  async function deleteSupplyLog(log: SupplyLog) {
    const confirmed = window.confirm("Permanently delete this supply log? This cannot be undone.");
    if (!confirmed) return;

    setDeleteSaving(true);
    const res = await fetch(`/api/admin/supplies/${log._id}`, {
      method: "DELETE",
    });
    setDeleteSaving(false);

    if (!res.ok) {
      setError("Failed to delete supply log.");
      return;
    }

    setSelectedLog(null);
    setEditingLog(null);
    await queryClient.invalidateQueries({ queryKey: ["admin", "supplies"] });
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
          <h1>Supply</h1>
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
                Water supplies
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
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleDownloadImage()}>
              Download Photo
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadPdf}>
              Download PDF
            </button>
          </div>
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
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} (@{driver.username})
                </option>
              ))}
            </select>
          </div>
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
        <span><strong style={{ color: "var(--text-primary)" }}>Vehicles:</strong> {summary.uniqueVehicles}</span>
        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Total Amount: {summary.totalAmount.toLocaleString("en-IN")}
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>
          {supplyTab === "water" ? "Loading water supplies..." : "Loading cash credits..."}
        </p>
      ) : effectiveLogs.length === 0 ? (
        <div className="card empty-state">
          {supplyTab === "water"
            ? "No water supplies for selected filters."
            : "No cash credits for selected filters."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {pagedGroupedLogs.map((group) => (
            <div key={group.key}>
              <div className="flex items-center justify-between" style={{ marginBottom: "0.55rem" }}>
                <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>{group.label}</h3>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      {supplyTab === "water" ? <th>Point</th> : <th>Amount</th>}
                      {supplyTab === "water" ? <th>Amount</th> : <th>Type</th>}
                      <th>Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((log) => (
                      <tr key={log._id}>
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
                            ? maskText(log.pointName ?? "-")
                            : (log.amount !== undefined ? log.amount : "-")}
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
                            log.amount !== undefined ? log.amount : "-"
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
              {selectedLog.pointName && (
                <div>
                  <div className="text-sm text-muted">Point</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.pointName}</div>
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
                            src={selectedLog.billImageUrl}
                            alt="Fuel bill uploaded by driver"
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
                onClick={() => void deleteSupplyLog(selectedLog)}
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
                {selectedLog.logType === "cash" ? "Edit Cash Credit" : "Edit Amount / Remark"}
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
              src={expandedImageUrl}
              alt="Fuel bill detailed preview"
              style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "10px", border: "1px solid var(--border)" }}
            />
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
              <h3>{editingLog.logType === "cash" ? "Edit Cash Credit" : "Edit Amount"}</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingLog(null)}>
                Close
              </button>
            </div>

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

            <button type="button" className="btn btn-primary" disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
