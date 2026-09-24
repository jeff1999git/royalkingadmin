"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime, formatMoney, formatNumber, istDayKey, istToday, relativeDayLabel } from "../../../lib/format";
import { cloudinaryAuto, cloudinaryThumb } from "../../../lib/imageUrl";
import {
  CASE_SIZES,
  casePricePreview,
  casesBySizeText,
  deliveredQuantity,
  isCaseSize,
  parseOptionalNumber,
  toProductType,
  validateDeliveryQuantities,
  type CaseSize,
  type DeliveryQuantities,
  type ProductType,
} from "../../../lib/supplyProduct";
import PaymentPill from "../../components/PaymentPill";
import ProductPill from "../../components/ProductPill";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import {
  fetchAllSupplies,
  useAdminAddedSupplies,
  useAdminCashCredits,
  useAdminCustomers,
  useAdminDrivers,
  type PaginatedSupplyLogsWithStats,
  type SupplyLog,
} from "../../hooks/useAdminQueries";

type SupplyTab = "water" | "cash";

type Filters = {
  date: string;
  month: string;
  driver: string;
  vehicle: string;
  customer: string;
  paymentStatus: "" | "cash" | "upi" | "not_paid";
  productType: "" | ProductType;
};

const EMPTY_FILTERS: Filters = { date: "", month: "", driver: "", vehicle: "", customer: "", paymentStatus: "", productType: "" };

const RECENT_DAYS = 5;

function maskText(value: string, max = 12) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

// The driver's note on a log, or "" when there isn't one. Blank and
// whitespace-only notes count as none.
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
// chosen product's count; taken back only applies to cans, and bottle size and
// price per case only to cases.
function formQuantities(
  productType: ProductType,
  quantity: string,
  takenBack: string,
  caseSize: "" | CaseSize,
  casePrice: string,
): DeliveryQuantities {
  return productType === "case"
    ? {
        productType: "case",
        caseSize: caseSize || undefined,
        casesDelivered: parseOptionalNumber(quantity),
        casePrice: parseOptionalNumber(casePrice),
      }
    : { productType: "can", cansDelivered: parseOptionalNumber(quantity), cansTakenBack: parseOptionalNumber(takenBack) };
}

// Bottle size choice for case deliveries in the add and edit dialogs. Nothing
// is selected until the admin picks one.
function CaseSizeRadios({
  name,
  value,
  onChange,
}: {
  name: string;
  value: "" | CaseSize;
  onChange: (size: CaseSize) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "0.5rem 1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
      {CASE_SIZES.map((size) => (
        <label key={size} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: value === size ? 700 : 500 }}>
          <input type="radio" name={name} value={size} checked={value === size} onChange={() => onChange(size)} />
          {size}
        </label>
      ))}
    </div>
  );
}

function CaseTotalPreview({ quantity, price }: { quantity: string; price: string }) {
  const preview = casePricePreview(parseOptionalNumber(quantity), parseOptionalNumber(price));
  if (!preview) return null;
  return (
    <div data-testid="case-total" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
      Amount: <strong style={{ color: "var(--text-primary)" }}>{preview}</strong>
    </div>
  );
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

const overlayStyle = (zIndex: number, opacity = 0.45): React.CSSProperties => ({
  position: "fixed",
  inset: 0,
  background: `rgba(0,0,0,${opacity})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  zIndex,
});

// ── Table ──
// Memoised so that typing in a dialog (which lives in page state) doesn't
// re-render up to 500 rows on every keystroke. Its props are the grouped rows
// (memoised) and two state setters, which React keeps stable.

type TableLog = SupplyLog & { serialNo: number };
type LogGroup = { key: string; label: string; entries: TableLog[] };

function LogRow({
  log,
  tab,
  onSelect,
  onExpandImage,
}: {
  log: TableLog;
  tab: SupplyTab;
  onSelect: (log: SupplyLog) => void;
  onExpandImage: (url: string) => void;
}) {
  const note = driverNote(log);
  function onKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(log);
    }
  }
  return (
    <tr
      className={note ? "supply-row-noted" : undefined}
      role="button"
      tabIndex={0}
      aria-label={`Open entry ${log.serialNo}`}
      onClick={() => onSelect(log)}
      onKeyDown={onKeyDown}
      style={{ cursor: "pointer" }}
    >
      <td>{log.serialNo}</td>
      <td>
        {tab === "water"
          ? maskText(log.customer?.name ?? log.pointName ?? "-")
          : (log.amount !== undefined ? formatNumber(log.amount) : "-")}
        {note && <NotePreview note={note} />}
      </td>
      <td>
        {tab === "water" ? (
          <div>
            <strong>{deliveredQuantity(log) ?? "-"}</strong>
            <div style={{ marginTop: "0.15rem" }}><ProductPill productType={log.productType} caseSize={log.caseSize} size="sm" /></div>
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
                onExpandImage(log.billImageUrl ?? "");
              }}
              style={{ width: "fit-content" }}
            >
              Fuel
            </button>
          ) : (
            <span style={{ fontWeight: 600 }}>Fuel</span>
          )
        ) : (
          <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{log.cashType ?? "-"}</span>
        )}
      </td>
      {tab === "water" && (
        <td>
          <div>{log.amount !== undefined ? formatNumber(log.amount) : "-"}</div>
          <PaymentPill status={log.paymentStatus} size="sm" />
        </td>
      )}
      <td>
        <div style={{ fontWeight: 600 }}>{log.driver?.name ? maskText(log.driver.name) : "-"}</div>
      </td>
    </tr>
  );
}

const LogTable = memo(function LogTable({
  groups,
  tab,
  onSelect,
  onExpandImage,
}: {
  groups: LogGroup[];
  tab: SupplyTab;
  onSelect: (log: SupplyLog) => void;
  onExpandImage: (url: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      {groups.map((group) => (
        <div key={group.key} className="log-group">
          <div className="flex items-center justify-between" style={{ marginBottom: "0.55rem" }}>
            <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>{group.label}</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  {tab === "water" ? <th>Customer</th> : <th>Amount</th>}
                  {tab === "water" ? <th>Qty</th> : <th>Type</th>}
                  {tab === "water" && <th>Amount</th>}
                  <th>Driver</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map((log) => (
                  <LogRow key={log._id} log={log} tab={tab} onSelect={onSelect} onExpandImage={onExpandImage} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
});

export default function SuppliesPage() {
  const maxDate = istToday();
  const maxMonth = maxDate.slice(0, 7);
  const [supplyTab, setSupplyTab] = useState<SupplyTab>("water");
  const [waterPage, setWaterPage] = useState(1);
  const [cashPage, setCashPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // Page-level messages (exports, fetches). Dialogs keep their own.
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedLog, setSelectedLog] = useState<SupplyLog | null>(null);
  const [detailError, setDetailError] = useState("");
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<SupplyLog | null>(null);
  const [editError, setEditError] = useState("");
  const [editingAmount, setEditingAmount] = useState("");
  const [editingInitialAmount, setEditingInitialAmount] = useState("");
  const [editingRemark, setEditingRemark] = useState("");
  const [editingCashType, setEditingCashType] = useState<"debit" | "fuel">("debit");
  const [editingDriverRemark, setEditingDriverRemark] = useState("");
  const [editingCansDelivered, setEditingCansDelivered] = useState("");
  const [editingCansTakenBack, setEditingCansTakenBack] = useState("");
  const [editingProductType, setEditingProductType] = useState<ProductType>("can");
  const [editingCaseSize, setEditingCaseSize] = useState<"" | CaseSize>("");
  const [editingCasePrice, setEditingCasePrice] = useState("");
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<"cash" | "upi" | "not_paid">("cash");
  const [editSaving, setEditSaving] = useState(false);
  const [exportBusy, setExportBusy] = useState<"" | "photo" | "pdf" | "sheet" | "drive">("");
  const [driveSheetLink, setDriveSheetLink] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [confirmDeleteLog, setConfirmDeleteLog] = useState<SupplyLog | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({
    driverId: "",
    customerId: "",
    suppliedAt: istToday(),
    productType: "can" as ProductType,
    // Quantity of the chosen product (cans or cases).
    cansDelivered: "",
    cansTakenBack: "",
    caseSize: "" as "" | CaseSize,
    casePrice: "",
    amount: "",
    notes: "",
  });
  const [addError, setAddError] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const { data: driverOptions } = useAdminDrivers();
  const { data: customerOptions } = useAdminCustomers();
  const sortedCustomers = useMemo(
    () => (customerOptions ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [customerOptions],
  );

  // With no filters, page 1 is the last RECENT_DAYS days and Next/Prev walk
  // older records. Any filter switches to normal unlimited pagination. The
  // product filter is left out: it narrows within the same window, so the
  // Cans and Cases totals add up to the unfiltered ones. Customer and payment
  // filters only apply to deliveries, so they don't count on the cash tab.
  const hasAnyFilter = Boolean(
    filters.date || filters.month || filters.driver || filters.vehicle
      || (supplyTab === "water" && (filters.customer || filters.paymentStatus)),
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
  const queryClient = useQueryClient();

  // Escape closes the top-most open dialog.
  const anyDialogOpen = Boolean(confirmDeleteLog || expandedImageUrl || editingLog || selectedLog || showAddForm);
  const closeTopDialog = useCallback(() => {
    if (confirmDeleteLog) setConfirmDeleteLog(null);
    else if (expandedImageUrl) setExpandedImageUrl(null);
    else if (editingLog) { setEditingLog(null); setEditError(""); }
    else if (selectedLog) { setSelectedLog(null); setDetailError(""); }
    else if (showAddForm) setShowAddForm(false);
  }, [confirmDeleteLog, expandedImageUrl, editingLog, selectedLog, showAddForm]);
  useEscapeKey(closeTopDialog, anyDialogOpen);

  async function downloadImageToDevice(imageUrl?: string | null) {
    if (!imageUrl) return;
    setDetailError("");
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
      setDetailError("Couldn't start the download automatically. The image was opened in a new tab.");
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

  const groupedLogs = useMemo<LogGroup[]>(() => {
    const groups = new Map<string, SupplyLog[]>();
    for (const log of effectiveLogs) {
      // Grouped by IST day, the business day the server also uses.
      const key = istDayKey(log.suppliedAt);
      const current = groups.get(key) ?? [];
      current.push(log);
      groups.set(key, current);
    }

    // Serial numbers restart at 1 for each day, following the displayed
    // latest-first order (top row of every day group is 1).
    return Array.from(groups.entries())
      .map(([key, entries]) => ({
        key,
        label: relativeDayLabel(entries[0]?.suppliedAt ?? Date.now()),
        entries: entries.map((entry, index) => ({ ...entry, serialNo: index + 1 })),
      }))
      .sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
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
      casesBySizeText: casesBySizeText(s?.casesBySize, s?.totalCases ?? 0),
      totalAmount: s?.totalAmount ?? 0,
    };
  }, [activeData]);

  function exportDatePart() {
    return filters.date || filters.month || istToday();
  }

  function exportFilenameBase() {
    return supplyTab === "water" ? `water-supplies-${exportDatePart()}` : `cash-credits-${exportDatePart()}`;
  }

  // Photo and PDF export the rows on screen. The export code is loaded on
  // first use so it stays out of the page's main bundle.
  async function handleDownloadImage() {
    setError("");
    setNotice("");
    setExportBusy("photo");
    try {
      const exports = await import("./exports");
      if (effectiveLogs.length > exports.MAX_PNG_ROWS) {
        setNotice(`The photo holds the first ${exports.MAX_PNG_ROWS} rows. Use Download Sheet or PDF for all of them.`);
      }
      const blob = await exports.renderPngBlob(supplyTab, effectiveLogs);
      exports.triggerDownload(`${exportFilenameBase()}.png`, blob);
    } catch {
      setError("Couldn't create the photo on this device. Try Download PDF or Download Sheet instead.");
    } finally {
      setExportBusy("");
    }
  }

  async function handleDownloadPdf() {
    setError("");
    // Opened synchronously inside the click so pop-up blockers allow it.
    const reportWindow = window.open("", "_blank", "width=1200,height=800");
    if (!reportWindow) {
      setError("The browser blocked the report window. Allow pop-ups for this site and try again.");
      return;
    }
    setExportBusy("pdf");
    try {
      const exports = await import("./exports");
      exports.writePrintReport(reportWindow, supplyTab, effectiveLogs);
    } catch {
      reportWindow.close();
      setError("Couldn't prepare the PDF. Please try again.");
    } finally {
      setExportBusy("");
    }
  }

  // Unlike Photo and PDF (the rows on screen), the sheet holds every entry
  // matching the filters, so it matches the summary totals. With no filters
  // that is the last RECENT_DAYS days.
  async function handleDownloadSheet() {
    setExportBusy("sheet");
    setError("");
    try {
      const [exports, logs] = await Promise.all([import("./exports"), fetchAllSupplies(supplyTab, queryFilters)]);
      const csv = exports.buildCsv(supplyTab, logs);
      exports.triggerDownload(`${exportFilenameBase()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
    } catch {
      setError("Couldn't prepare the sheet. Please try again.");
    } finally {
      setExportBusy("");
    }
  }

  // Same rows as Download Sheet, saved into the admin's Google Drive as a
  // Google Sheet. Google's sign-in script is loaded only when this is used.
  async function handleSaveToDrive() {
    setError("");
    setDriveSheetLink(null);
    setExportBusy("drive");
    try {
      const drive = await import("../../../lib/googleDrive");
      if (!drive.googleClientId) {
        setError("Saving to Google Drive isn't set up yet: add NEXT_PUBLIC_GOOGLE_CLIENT_ID (see the README).");
        return;
      }
      await drive.loadGoogleIdentity();
      const token = await drive.requestDriveToken();
      const [exports, logs] = await Promise.all([import("./exports"), fetchAllSupplies(supplyTab, queryFilters)]);
      const csv = exports.buildCsv(supplyTab, logs, { bom: false });
      const savedAt = formatDateTime(new Date()).split(", ")[1] ?? "";
      const title = `Royal King ${supplyTab === "water" ? "Water Supplies" : "Cash Credits"} ${exportDatePart()} (saved ${savedAt})`;
      const file = await drive.saveCsvAsGoogleSheet(token, title, csv);
      setDriveSheetLink(file.webViewLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save to Google Drive. Please try again.");
    } finally {
      setExportBusy("");
    }
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function openAddForm() {
    setAddData({
      driverId: "",
      customerId: "",
      suppliedAt: istToday(),
      productType: "can",
      cansDelivered: "",
      cansTakenBack: "",
      caseSize: "",
      casePrice: "",
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
    const quantities = formQuantities(addData.productType, addData.cansDelivered, addData.cansTakenBack, addData.caseSize, addData.casePrice);
    const quantityError = validateDeliveryQuantities(quantities);
    if (quantityError) {
      setAddError(quantityError);
      return;
    }
    const overrideAmount = addData.productType === "can" && addData.amount.trim() !== "" ? Number(addData.amount) : undefined;
    if (overrideAmount !== undefined && (!Number.isFinite(overrideAmount) || overrideAmount < 0)) {
      setAddError("Amount must be a valid non-negative number.");
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
          // Cases are priced from the price per case; the override is for cans.
          amount: overrideAmount,
          notes: addData.notes || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setAddError(data.error ?? "Failed to create delivery."); return; }
      setShowAddForm(false);
      // Fire-and-forget: the visible list refetches in the background while
      // keepPreviousData keeps the current rows on screen.
      void queryClient.invalidateQueries({ queryKey: ["admin", "supplies"] });
    } catch {
      setAddError("Failed to create delivery. Please check your connection.");
    } finally {
      setAddSubmitting(false);
    }
  }

  function openEditModal(log: SupplyLog) {
    const amount = log.amount !== undefined ? String(log.amount) : "";
    setEditingLog(log);
    setEditingAmount(amount);
    setEditingInitialAmount(amount);
    setEditingRemark(log.adminRemark ?? "");
    setEditingCashType(log.cashType === "fuel" ? "fuel" : "debit");
    setEditingDriverRemark(log.notes ?? "");
    setEditingProductType(toProductType(log.productType));
    const quantity = deliveredQuantity(log);
    setEditingCansDelivered(quantity !== undefined ? String(quantity) : "");
    setEditingCansTakenBack(log.cansTakenBack !== undefined ? String(log.cansTakenBack) : "");
    setEditingCaseSize(isCaseSize(log.caseSize) ? log.caseSize : "");
    setEditingCasePrice(log.casePrice !== undefined ? String(log.casePrice) : "");
    const ps = log.paymentStatus;
    setEditingPaymentStatus(ps === "upi" || ps === "not_paid" ? ps : "cash");
    setEditError("");
  }

  function closeEditModal() {
    setEditingLog(null);
    setEditError("");
  }

  async function saveEdit() {
    if (!editingLog) return;
    setEditError("");
    const isCash = editingLog.logType === "cash";
    // Only a changed amount is sent. Blank clears it so the server re-prices
    // from the quantity; unchanged leaves the saved amount alone.
    const amountChanged = editingAmount.trim() !== editingInitialAmount.trim();
    const amountValue = editingAmount.trim() === "" ? null : Number(editingAmount);
    if (isCash && (amountValue === null || !Number.isFinite(amountValue) || amountValue < 0)) {
      setEditError("Please enter a valid amount.");
      return;
    }
    if (!isCash && amountChanged && amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0)) {
      setEditError("Amount must be a valid non-negative number.");
      return;
    }
    const quantities = formQuantities(editingProductType, editingCansDelivered, editingCansTakenBack, editingCaseSize, editingCasePrice);
    if (!isCash) {
      // Switching product needs the new quantity; a plain edit may leave it blank.
      const switching = editingProductType !== toProductType(editingLog.productType);
      const quantityError = validateDeliveryQuantities(quantities, { partial: !switching });
      if (quantityError) {
        setEditError(quantityError);
        return;
      }
    }

    setEditSaving(true);
    try {
      const body = isCash
        ? {
            amount: amountValue,
            adminRemark: editingRemark,
            cashType: editingCashType,
            notes: editingDriverRemark,
          }
        : {
            // Always carries productType, so older rows get it recorded on save.
            ...quantities,
            // A cleared "taken back" is sent as null so the server removes it.
            ...(editingProductType === "can" && editingCansTakenBack.trim() === "" && editingLog.cansTakenBack !== undefined
              ? { cansTakenBack: null }
              : {}),
            ...(amountChanged ? { amount: amountValue } : {}),
            notes: editingDriverRemark,
            adminRemark: editingRemark,
            paymentStatus: editingPaymentStatus,
          };
      const res = await fetch(`/api/admin/supplies/${editingLog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as SupplyLog & { error?: string };
      if (!res.ok) {
        setEditError(data.error ?? "Failed to update. Please try again.");
        return;
      }

      // Refetch rather than patch the row in place: quantity and product
      // changes also move the summary totals, which come from the server.
      void queryClient.invalidateQueries({ queryKey: ["admin", "supplies"] });
      setSelectedLog((prev) => (prev && prev._id === data._id ? data : prev));
      setEditingLog(null);
    } catch {
      setEditError("Failed to update. Please check your connection and try again.");
    } finally {
      setEditSaving(false);
    }
  }

  async function doDeleteSupplyLog() {
    if (!confirmDeleteLog) return;
    const log = confirmDeleteLog;
    setConfirmDeleteLog(null);
    setDeleteSaving(true);
    setDetailError("");
    try {
      const res = await fetch(`/api/admin/supplies/${log._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setDetailError(data.error ?? "Failed to delete supply log.");
        return;
      }
      setSelectedLog(null);
      setEditingLog(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "supplies"] });
    } catch {
      setDetailError("Failed to delete supply log. Please try again.");
    } finally {
      setDeleteSaving(false);
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
              {(["water", "cash"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSupplyTab(tab)}
                  aria-pressed={supplyTab === tab}
                  style={{
                    border: "0",
                    borderRadius: "12px",
                    background: supplyTab === tab ? "var(--accent-primary)" : "#f3f4f6",
                    padding: "0.65rem 0.9rem",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                    color: supplyTab === tab ? "#ffffff" : "#111827",
                    flex: 1,
                  }}
                >
                  {tab === "water" ? "Deliveries" : "Cash Credits"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem", alignItems: "center" }}>
            {supplyTab === "water" && (
              <button type="button" className="btn btn-primary btn-sm" onClick={openAddForm}>
                + Add Delivery
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleDownloadImage()} disabled={exportBusy !== ""}>
              {exportBusy === "photo" ? "Preparing..." : "Download Photo"}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleDownloadPdf()} disabled={exportBusy !== ""}>
              {exportBusy === "pdf" ? "Preparing..." : "Download PDF"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleDownloadSheet()}
              disabled={exportBusy !== ""}
              title="Spreadsheet (.csv) of every entry matching the filters. Opens in Google Sheets or Excel."
            >
              {exportBusy === "sheet" ? "Preparing..." : "Download Sheet"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleSaveToDrive()}
              disabled={exportBusy !== ""}
              title="Save every entry matching the filters as a Google Sheet in your Google Drive."
            >
              {exportBusy === "drive" ? "Saving to Drive..." : "Save to Google Drive"}
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
                {sortedCustomers.map((c) => (
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
            <span>
              <strong style={{ color: "var(--text-primary)" }}>Cases Del.:</strong> {summary.totalCases}
              {summary.casesBySizeText && ` (${summary.casesBySizeText})`}
            </span>
            <span><strong style={{ color: "var(--text-primary)" }}>Taken Back:</strong> {summary.totalCansTakenBack}</span>
          </>
        )}
        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Total Amount: {formatMoney(summary.totalAmount)}
        </span>
        {!hasAnyFilter && (
          <span style={{ marginLeft: "auto" }}>
            {currentPage === 1 ? `Last ${RECENT_DAYS} days` : "Older records"}
          </span>
        )}
      </div>

      {(error || fetchError) && <div className="alert alert-error">{error || fetchError}</div>}
      {notice && <div className="alert alert-info">{notice}</div>}

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
        <LogTable groups={groupedLogs} tab={supplyTab} onSelect={setSelectedLog} onExpandImage={setExpandedImageUrl} />
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
        <div style={overlayStyle(250)} onClick={() => setShowAddForm(false)}>
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="addDeliveryTitle"
            style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3 id="addDeliveryTitle">Add Delivery</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddForm(false)}>Close</button>
            </div>

            <div className="grid-2" style={{ marginBottom: "1rem" }}>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="addSuppliedAt">Delivery Date *</label>
                <input
                  id="addSuppliedAt"
                  className="form-input"
                  type="date"
                  max={maxDate}
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
                  {sortedCustomers.filter((c) => c.isActive).map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.area ? ` — ${c.area}` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Product *</label>
                <ProductRadios
                  name="addProductType"
                  value={addData.productType}
                  onChange={(pt) => setAddData((d) => ({ ...d, productType: pt, cansDelivered: "", cansTakenBack: "", caseSize: "", casePrice: "", amount: "" }))}
                />
              </div>

              {addData.productType === "case" && (
                <div className="form-group">
                  <label className="form-label">Bottle Size *</label>
                  <CaseSizeRadios name="addCaseSize" value={addData.caseSize} onChange={(size) => setAddData((d) => ({ ...d, caseSize: size }))} />
                </div>
              )}

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

              {addData.productType === "case" ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="addCasePrice">Price per Case (₹) *</label>
                  <input
                    id="addCasePrice"
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="e.g. 120"
                    value={addData.casePrice}
                    onChange={(e) => setAddData((d) => ({ ...d, casePrice: e.target.value }))}
                  />
                  <CaseTotalPreview quantity={addData.cansDelivered} price={addData.casePrice} />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="addAmount">Amount (₹) — auto-calculated if blank</label>
                  <input
                    id="addAmount"
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Leave blank to auto-calculate"
                    value={addData.amount}
                    onChange={(e) => setAddData((d) => ({ ...d, amount: e.target.value }))}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="addNotes">Notes (Optional)</label>
                <input
                  id="addNotes"
                  className="form-input"
                  maxLength={1000}
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
        <div style={overlayStyle(250)} onClick={() => { setSelectedLog(null); setDetailError(""); }}>
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplyDetailsTitle"
            style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3 id="supplyDetailsTitle">Supply Details</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setSelectedLog(null); setDetailError(""); }}>
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
                  <ProductPill productType={selectedLog.productType} caseSize={selectedLog.caseSize} />
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
              {toProductType(selectedLog.productType) === "case" && selectedLog.casePrice !== undefined && (
                <div>
                  <div className="text-sm text-muted">Price per Case</div>
                  <div style={{ fontWeight: 600 }}>{formatMoney(selectedLog.casePrice)}</div>
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
                          aria-label="View the fuel bill at full size"
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
                            width={640}
                            height={480}
                            style={{ width: "100%", maxWidth: "260px", height: "auto", borderRadius: "10px", border: "1px solid var(--border)" }}
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
                  <div style={{ fontWeight: 600 }}>{formatMoney(selectedLog.amount)}</div>
                </div>
              )}
              {selectedLog.logType !== "cash" && (
                <div>
                  <div className="text-sm text-muted">Payment Status</div>
                  <PaymentPill status={selectedLog.paymentStatus} />
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
            {detailError && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{detailError}</div>}
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
                  setDetailError("");
                }}
              >
                {selectedLog.logType === "cash" ? "Edit Cash Credit" : "Edit Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedImageUrl && (
        <div style={overlayStyle(300, 0.78)} onClick={() => setExpandedImageUrl(null)}>
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fuelBillTitle"
            style={{ width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 id="fuelBillTitle">Fuel Bill Preview</h3>
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
            {detailError && <div className="alert alert-error">{detailError}</div>}
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
        <div style={overlayStyle(400, 0.55)} onClick={() => setConfirmDeleteLog(null)}>
          <div
            className="card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deleteLogTitle"
            style={{ width: "100%", maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="deleteLogTitle" style={{ marginBottom: "0.75rem" }}>Delete Log?</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Permanently delete the {confirmDeleteLog.logType === "cash" ? "cash credit" : "delivery"} log for{" "}
              <strong>{confirmDeleteLog.customer?.name ?? confirmDeleteLog.pointName ?? "this entry"}</strong>{" "}
              on {formatDateTime(confirmDeleteLog.suppliedAt)}? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDeleteLog(null)} autoFocus>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={deleteSaving} onClick={() => void doDeleteSupplyLog()}>
                {deleteSaving ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLog && (
        <div style={overlayStyle(260)} onClick={closeEditModal}>
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editLogTitle"
            style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3 id="editLogTitle">{editingLog.logType === "cash" ? "Edit Cash Credit" : "Edit Delivery"}</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={closeEditModal}>
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
                        // Back on the saved product: restore the saved values.
                        const quantity = deliveredQuantity(editingLog);
                        setEditingCansDelivered(quantity !== undefined ? String(quantity) : "");
                        setEditingCansTakenBack(editingLog.cansTakenBack !== undefined ? String(editingLog.cansTakenBack) : "");
                        setEditingCaseSize(isCaseSize(editingLog.caseSize) ? editingLog.caseSize : "");
                        setEditingCasePrice(editingLog.casePrice !== undefined ? String(editingLog.casePrice) : "");
                      } else {
                        // A count entered for one product must never be saved as the other.
                        setEditingCansDelivered("");
                        setEditingCansTakenBack("");
                        setEditingCaseSize("");
                        setEditingCasePrice("");
                      }
                    }}
                  />
                  {editingProductType !== toProductType(editingLog.productType) && (
                    <div className="text-sm text-muted" style={{ marginTop: "0.3rem" }}>
                      {editingProductType === "case"
                        ? "Choose the bottle size and enter the cases and price per case. The amount will be cases × price."
                        : "Enter the cans delivered. The amount will be recalculated at the customer's can rate (cleared if none is set)."}
                    </div>
                  )}
                </div>
                {editingProductType === "case" && (
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label className="form-label">Bottle Size</label>
                    <CaseSizeRadios name="editCaseSize" value={editingCaseSize} onChange={setEditingCaseSize} />
                  </div>
                )}
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
                {editingProductType === "case" && (
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label className="form-label" htmlFor="editCasePrice">Price per Case (₹)</label>
                    <input
                      id="editCasePrice"
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={editingCasePrice}
                      onChange={(e) => setEditingCasePrice(e.target.value)}
                    />
                    <CaseTotalPreview quantity={editingCansDelivered} price={editingCasePrice} />
                  </div>
                )}
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
                  <label className="form-label" htmlFor="editWaterAmount">Amount (₹)</label>
                  <input
                    id="editWaterAmount"
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={editingAmount}
                    onChange={(e) => setEditingAmount(e.target.value)}
                  />
                  <div className="text-sm text-muted" style={{ marginTop: "0.3rem" }}>
                    Leave it as is to keep the saved amount. Clear it to recalculate from the quantity.
                  </div>
                </div>
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
                    maxLength={1000}
                    value={editingDriverRemark}
                    onChange={(e) => setEditingDriverRemark(e.target.value)}
                  />
                </div>
              </>
            )}

            {editingLog.logType === "cash" && (
              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label className="form-label" htmlFor="editAmount">Amount (₹)</label>
                <input
                  id="editAmount"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
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
                maxLength={1000}
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
                    maxLength={1000}
                    value={editingDriverRemark}
                    onChange={(e) => setEditingDriverRemark(e.target.value)}
                  />
                </div>
              </>
            )}

            {editError && <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>{editError}</div>}

            <button type="button" className="btn btn-primary" disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
