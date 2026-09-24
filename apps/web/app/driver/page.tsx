"use client";

/* eslint-disable @next/next/no-img-element */
import { ChangeEvent, FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { formatDateTime, formatMoney, istDayKey, istToday, relativeDayLabel } from "../../lib/format";
import { cloudinaryAuto, cloudinaryThumb } from "../../lib/imageUrl";
import {
  CASE_SIZES,
  casePricePreview,
  deliveredQuantity,
  parseOptionalNumber,
  toProductType,
  unitWord,
  validateDeliveryQuantities,
  type CaseSize,
  type DeliveryQuantities,
  type ProductType,
} from "../../lib/supplyProduct";
import { useEscapeKey } from "../hooks/useEscapeKey";

interface Vehicle {
  _id: string;
  name: string;
  vehicleNumber: string;
  capacity: string;
}

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  area?: string;
  locationType?: "home" | "office" | "both";
  subscriptionCans: number;
  cashPerCan?: number;
}

interface DeliveryOption {
  key: string;
  customerId: string;
  label: string;
  locationType: "home" | "office" | null;
  subscriptionCans: number;
  cashPerCan?: number;
}

interface DeliveryLog {
  _id: string;
  suppliedAt: string;
  pointName?: string;
  cansDelivered?: number;
  cansTakenBack?: number;
  casesDelivered?: number;
  caseSize?: CaseSize;
  casePrice?: number;
  notes?: string;
  amount?: number;
  logType?: "water" | "cash";
  productType?: ProductType;
  cashType?: "debit" | "fuel";
  paymentStatus?: "cash" | "upi" | "not_paid";
  billImageUrl?: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
    area?: string;
  };
  vehicle?: Vehicle;
}

type NumberedLog = DeliveryLog & { serialNo: number };

interface GroupedLogs {
  key: string;
  label: string;
  entries: NumberedLog[];
}

interface DriverVehiclesResponse {
  vehicles: Vehicle[];
  assignedVehicleId: string | null;
}

function isSupportedImageFile(file: File) {
  const fileName = file.name.toLowerCase();
  const hasSupportedExtension = /\.(heic|heif|jpg|jpeg|png|webp)$/i.test(fileName);
  return file.type.startsWith("image/") || hasSupportedExtension;
}

function isHeicLikeFile(file: File) {
  const fileName = file.name.toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || /\.(heic|heif)$/i.test(fileName);
}

async function compressImageFile(file: File) {
  if (!isSupportedImageFile(file)) {
    throw new Error("Please select a valid image file.");
  }

  if (isHeicLikeFile(file)) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    let image: CanvasImageSource & { width: number; height: number; close?: () => void };

    if (typeof createImageBitmap === "function") {
      try {
        image = await createImageBitmap(file);
      } catch {
        image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Could not read the selected image."));
          img.src = objectUrl;
        });
      }
    } else {
      image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read the selected image."));
        img.src = objectUrl;
      });
    }

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Image compression is not supported on this device.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.72);
    });

    if (!compressedBlob) {
      throw new Error("Failed to compress the image.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "fuel-bill";
    image.close?.();
    return new File([compressedBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const RECENT_DAYS = 5;

// Every driver request goes through here: a 401 means the session ended (or
// the driver was deactivated), so the app returns to the login page instead
// of showing an empty ledger.
async function driverGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 401) {
    void signOut({ callbackUrl: "/login" });
    throw new Error("Signed out");
  }
  if (!res.ok) throw new Error("Request failed");
  return (await res.json()) as T;
}

function normalizeLogs(data: DeliveryLog[] | undefined): DeliveryLog[] {
  return (data ?? []).map((log) => ({
    ...log,
    logType: log.logType === "cash" ? "cash" : "water",
    // Deliveries saved before the can/case choice existed are cans.
    productType: toProductType(log.productType),
  }));
}

// "2 cans", "3 cases · 500ml", or null when the row has no delivered quantity.
function deliveredText(log: DeliveryLog): string | null {
  const quantity = deliveredQuantity(log);
  if (quantity === undefined) return null;
  const productType = toProductType(log.productType);
  const text = `${quantity} ${unitWord(productType, quantity)}`;
  return productType === "case" && log.caseSize ? `${text} · ${log.caseSize}` : text;
}

function buildGroupedLogs(source: DeliveryLog[]): GroupedLogs[] {
  const map = new Map<string, DeliveryLog[]>();
  for (const log of source) {
    // Grouped by IST business day, the same day the server uses.
    const key = istDayKey(log.suppliedAt);
    const existing = map.get(key) ?? [];
    existing.push(log);
    map.set(key, existing);
  }

  // Serial numbers restart at 1 for each day, following the displayed
  // latest-first order (top entry of every day group is 1).
  return Array.from(map.entries())
    .map(([key, entries]) => ({
      key,
      label: relativeDayLabel(entries[0]?.suppliedAt ?? Date.now()),
      entries: entries
        .sort((a, b) => new Date(b.suppliedAt).getTime() - new Date(a.suppliedAt).getTime())
        .map((entry, index) => ({ ...entry, serialNo: index + 1 })),
    }))
    .sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
}

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  border: 0,
  borderRadius: "12px",
  background: active ? "var(--accent-primary)" : "#f3f4f6",
  padding: "0.65rem 0.9rem",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
  color: active ? "#ffffff" : "#111827",
  flex: 1,
});

const calendarButtonStyle: React.CSSProperties = {
  width: "36px", height: "36px", borderRadius: "8px",
  border: "1px solid #ffffff",
  background: "var(--accent-primary)", color: "#ffffff",
  display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

function CalendarIcon({ clear }: { clear: boolean }) {
  return clear ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M18 6L6 18" /><path d="M6 6l12 12" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 2v4" /><path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}

function ErrorWithRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="alert alert-error" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
      <span>{message}</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
    </div>
  );
}

// ── Log cards ──
// Memoised so typing in a form (page state) doesn't re-render every card.
// Their props are memoised groups and a state setter, which React keeps stable.

const DeliveryCards = memo(function DeliveryCards({ groups, onSelect }: { groups: GroupedLogs[]; onSelect: (log: DeliveryLog) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {groups.map((group) => (
        <div key={group.key} className="log-group">
          <h3 style={{ marginBottom: "0.6rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            {group.label}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {group.entries.map((log) => (
              <button
                key={log._id}
                type="button"
                className="card"
                onClick={() => onSelect(log)}
                style={{
                  textAlign: "left", cursor: "pointer",
                  border: "1px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: "0.35rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {log.serialNo}. {log.customer?.name ?? log.pointName ?? "Delivery"}
                  </div>
                  {deliveredText(log) && (
                    <div style={{
                      background: log.productType === "case" ? "var(--warning)" : "var(--accent-primary)", color: "#fff",
                      borderRadius: "20px", padding: "0.15rem 0.65rem",
                      fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap",
                    }}>
                      {deliveredText(log)}
                    </div>
                  )}
                </div>
                {log.customer?.area && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{log.customer.area}</div>
                )}
                {log.cansTakenBack !== undefined && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Taken back: <strong>{log.cansTakenBack} can{log.cansTakenBack !== 1 ? "s" : ""}</strong>
                  </div>
                )}
                {log.amount !== undefined && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Amount: <strong>{formatMoney(log.amount)}</strong>
                  </div>
                )}
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {formatDateTime(log.suppliedAt)}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

const CashCards = memo(function CashCards({ groups, onSelect }: { groups: GroupedLogs[]; onSelect: (log: DeliveryLog) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {groups.map((group) => (
        <div key={group.key} className="log-group">
          <h3 style={{ marginBottom: "0.6rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            {group.label}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {group.entries.map((log) => (
              <button
                key={log._id}
                type="button"
                className="card"
                onClick={() => onSelect(log)}
                style={{
                  textAlign: "left", cursor: "pointer",
                  border: "1px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: "0.35rem",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {log.serialNo}. Amount: {log.amount !== undefined ? formatMoney(log.amount) : "-"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                  {log.cashType ?? "-"}
                </div>
                {log.billImageUrl && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.25rem" }}>
                    <img
                      src={cloudinaryThumb(log.billImageUrl, 120)}
                      alt="Fuel bill preview"
                      loading="lazy"
                      decoding="async"
                      width={52}
                      height={52}
                      style={{
                        width: "52px", height: "52px", objectFit: "cover",
                        borderRadius: "8px", border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                )}
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {formatDateTime(log.suppliedAt)}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState<"delivery" | "cash" | "register">("delivery");

  // Each form keeps its own messages so they never leak across tabs.
  const [submitting, setSubmitting] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [deliverySuccess, setDeliverySuccess] = useState("");
  const [cashError, setCashError] = useState("");
  const [cashSuccess, setCashSuccess] = useState("");
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [detailError, setDetailError] = useState("");
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [cashDateFilter, setCashDateFilter] = useState("");
  const deliveryDateInputRef = useRef<HTMLInputElement | null>(null);
  const cashDateInputRef = useRef<HTMLInputElement | null>(null);

  // Delivery form
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryKey: "",
    productType: "can" as ProductType,
    // Quantity of the chosen product (cans or cases).
    cansDelivered: "",
    cansTakenBack: "",
    // Case deliveries only; the driver must pick a size and type the price.
    caseSize: "" as "" | CaseSize,
    casePrice: "",
    vehicleId: "",
    notes: "",
    paymentStatus: "cash" as "cash" | "upi" | "not_paid",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const customerListRef = useRef<HTMLDivElement | null>(null);

  // Register customer form
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    locationType: "home" as "home" | "office" | "both",
    cashPerCan: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registering, setRegistering] = useState(false);

  // Cash form
  const [cashForm, setCashForm] = useState({
    amount: "",
    cashType: "fuel" as "debit" | "fuel",
    notes: "",
  });
  const [cashBillFile, setCashBillFile] = useState<File | null>(null);
  const [cashBillPreview, setCashBillPreview] = useState("");
  const [cashBillProcessing, setCashBillProcessing] = useState(false);
  const cashBillInputRef = useRef<HTMLInputElement | null>(null);
  const cashCameraInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  const vehiclesQuery = useQuery<DriverVehiclesResponse>({
    queryKey: ["driver", "vehicles"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const data = await driverGet<DriverVehiclesResponse>("/api/driver/vehicles");
      return {
        vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
        assignedVehicleId: data.assignedVehicleId ?? null,
      };
    },
  });
  const { data: vehiclesData } = vehiclesQuery;

  const customersQuery = useQuery<Customer[]>({
    queryKey: ["driver", "customers"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const data = await driverGet<unknown>("/api/driver/customers");
      return Array.isArray(data) ? (data as Customer[]) : [];
    },
  });
  const { data: customersData, isLoading: customersLoading } = customersQuery;

  const logsQuery = useQuery<DeliveryLog[]>({
    queryKey: ["driver", "supplies"],
    queryFn: async () => {
      const data = await driverGet<unknown>("/api/driver/supplies");
      return Array.isArray(data) ? (data as DeliveryLog[]) : [];
    },
  });
  const { data: logsData, isLoading: logsLoading } = logsQuery;

  // Older days are fetched on demand when a date filter is picked
  const deliveryDateQuery = useQuery<DeliveryLog[]>({
    queryKey: ["driver", "supplies", "byDate", deliveryDateFilter],
    enabled: Boolean(deliveryDateFilter),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const data = await driverGet<unknown>(`/api/driver/supplies?date=${encodeURIComponent(deliveryDateFilter)}`);
      return Array.isArray(data) ? (data as DeliveryLog[]) : [];
    },
  });
  const { data: deliveryDateData, isLoading: deliveryDateLoading } = deliveryDateQuery;

  const cashDateQuery = useQuery<DeliveryLog[]>({
    queryKey: ["driver", "supplies", "byDate", cashDateFilter],
    enabled: Boolean(cashDateFilter),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const data = await driverGet<unknown>(`/api/driver/supplies?date=${encodeURIComponent(cashDateFilter)}`);
      return Array.isArray(data) ? (data as DeliveryLog[]) : [];
    },
  });
  const { data: cashDateData, isLoading: cashDateLoading } = cashDateQuery;

  const vehicles = vehiclesData?.vehicles ?? [];
  const assignedVehicleId =
    vehiclesData?.assignedVehicleId &&
    vehiclesData.vehicles.some((v) => v._id === vehiclesData.assignedVehicleId)
      ? vehiclesData.assignedVehicleId
      : "";

  // Default the delivery form's vehicle to the assigned one once loaded
  useEffect(() => {
    if (!assignedVehicleId) return;
    setDeliveryForm((f) => (f.vehicleId ? f : { ...f, vehicleId: assignedVehicleId }));
  }, [assignedVehicleId]);

  // Close customer dropdown on outside click
  useEffect(() => {
    if (!showCustomerList) return;
    function handler(e: MouseEvent) {
      if (customerListRef.current && !customerListRef.current.contains(e.target as Node)) {
        setShowCustomerList(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCustomerList]);

  // Escape closes the top-most dialog.
  const closeTopDialog = useCallback(() => {
    if (expandedImageUrl) setExpandedImageUrl(null);
    else if (selectedLog) { setSelectedLog(null); setDetailError(""); }
  }, [expandedImageUrl, selectedLog]);
  useEscapeKey(closeTopDialog, Boolean(expandedImageUrl || selectedLog));

  const logs = useMemo<DeliveryLog[]>(() => normalizeLogs(logsData), [logsData]);

  const deliveryLogs = useMemo(
    () => logs.filter((log) => (log.logType ?? "water") === "water"),
    [logs],
  );
  const cashLogs = useMemo(
    () => logs.filter((log) => log.logType === "cash"),
    [logs],
  );

  const groupedDeliveryLogs = useMemo(() => buildGroupedLogs(deliveryLogs), [deliveryLogs]);
  const groupedCashLogs = useMemo(() => buildGroupedLogs(cashLogs), [cashLogs]);

  const deliveryOptions = useMemo<DeliveryOption[]>(() => {
    const opts: DeliveryOption[] = [];
    for (const c of customersData ?? []) {
      const lt = c.locationType;
      const displayLabel = `${c.name}${c.phone ? ` (${c.phone})` : ""}`;
      const base = { customerId: c._id, label: displayLabel, subscriptionCans: c.subscriptionCans, cashPerCan: c.cashPerCan };
      if (!lt || lt === "home") {
        opts.push({ key: `${c._id}-home`, ...base, locationType: "home" });
      } else if (lt === "office") {
        opts.push({ key: `${c._id}-office`, ...base, locationType: "office" });
      } else if (lt === "both") {
        opts.push({ key: `${c._id}-home`, ...base, locationType: "home" });
        opts.push({ key: `${c._id}-office`, ...base, locationType: "office" });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [customersData]);

  const filteredDeliveryOptions = useMemo(() => {
    if (!customerSearch.trim()) return deliveryOptions;
    const q = customerSearch.toLowerCase();
    return deliveryOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [deliveryOptions, customerSearch]);

  const selectedDeliveryOption = useMemo(
    () => deliveryOptions.find((o) => o.key === deliveryForm.deliveryKey) ?? null,
    [deliveryOptions, deliveryForm.deliveryKey],
  );
  const isCaseDelivery = deliveryForm.productType === "case";
  const caseTotalPreview = isCaseDelivery
    ? casePricePreview(parseOptionalNumber(deliveryForm.cansDelivered), parseOptionalNumber(deliveryForm.casePrice))
    : null;

  const maxSelectableDateValue = istToday();

  // With no date filter, every day the server sent (the last RECENT_DAYS
  // days) is shown.
  const visibleDeliveryGroups = useMemo(() => {
    if (deliveryDateFilter) {
      const dayLogs = normalizeLogs(deliveryDateData).filter((log) => (log.logType ?? "water") === "water");
      return buildGroupedLogs(dayLogs).slice(0, 1);
    }
    return groupedDeliveryLogs;
  }, [groupedDeliveryLogs, deliveryDateFilter, deliveryDateData]);

  const visibleCashGroups = useMemo(() => {
    if (cashDateFilter) {
      const dayLogs = normalizeLogs(cashDateData).filter((log) => log.logType === "cash");
      return buildGroupedLogs(dayLogs).slice(0, 1);
    }
    return groupedCashLogs;
  }, [cashDateFilter, groupedCashLogs, cashDateData]);

  const prefersCameraCapture = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const coarsePointer =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const userAgent = navigator.userAgent.toLowerCase();
    return coarsePointer || /android|iphone|ipad|ipod|mobile/.test(userAgent);
  }, []);

  useEffect(() => {
    return () => {
      if (cashBillPreview.startsWith("blob:")) {
        URL.revokeObjectURL(cashBillPreview);
      }
    };
  }, [cashBillPreview]);

  function switchTab(tab: "delivery" | "cash" | "register") {
    setActiveTab(tab);
    setDeliveryError("");
    setDeliverySuccess("");
    setCashError("");
    setCashSuccess("");
    setRegisterError("");
    setRegisterSuccess("");
  }

  function clearCashBillSelection() {
    if (cashBillPreview.startsWith("blob:")) URL.revokeObjectURL(cashBillPreview);
    if (cashBillInputRef.current) cashBillInputRef.current.value = "";
    if (cashCameraInputRef.current) cashCameraInputRef.current.value = "";
    setCashBillPreview("");
    setCashBillFile(null);
  }

  async function handleCashBillChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) { clearCashBillSelection(); return; }
    setCashError("");
    setCashBillProcessing(true);
    try {
      const compressedFile = await compressImageFile(selectedFile);
      // The server (and Vercel) accept at most 4 MB. HEIC photos can't be
      // compressed in the browser, so catch oversized ones before uploading.
      if (compressedFile.size > 4 * 1024 * 1024) {
        clearCashBillSelection();
        setCashError("Photo is too large (over 4 MB). Please retake it or take a screenshot of the bill.");
        e.target.value = "";
        return;
      }
      if (cashBillPreview.startsWith("blob:")) URL.revokeObjectURL(cashBillPreview);
      setCashBillFile(compressedFile);
      setCashBillPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      clearCashBillSelection();
      setCashError(err instanceof Error ? err.message : "Failed to process the image.");
      e.target.value = "";
    } finally {
      setCashBillProcessing(false);
    }
  }

  function openDatePicker(input: HTMLInputElement | null) {
    if (!input) return;
    if (typeof input.showPicker === "function") { input.showPicker(); return; }
    input.focus();
    input.click();
  }

  async function downloadImageToDevice(imageUrl?: string | null) {
    if (!imageUrl) return;
    setDetailError("");
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to download image.");
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

  async function submitDelivery(e: FormEvent) {
    e.preventDefault();
    setDeliveryError("");
    setDeliverySuccess("");

    const selectedOpt = deliveryOptions.find((o) => o.key === deliveryForm.deliveryKey);
    if (!selectedOpt) {
      setDeliveryError("Please select a customer.");
      return;
    }

    const quantity = parseOptionalNumber(deliveryForm.cansDelivered);
    const quantities: DeliveryQuantities = deliveryForm.productType === "case"
      ? {
          productType: "case",
          caseSize: deliveryForm.caseSize || undefined,
          casesDelivered: quantity,
          casePrice: parseOptionalNumber(deliveryForm.casePrice),
        }
      : { productType: "can", cansDelivered: quantity, cansTakenBack: parseOptionalNumber(deliveryForm.cansTakenBack) };
    const quantityError = validateDeliveryQuantities(quantities);
    if (quantityError) {
      setDeliveryError(quantityError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/driver/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logType: "water",
          customerId: selectedOpt.customerId,
          ...quantities,
          vehicleId: deliveryForm.vehicleId || undefined,
          notes: deliveryForm.notes,
          paymentStatus: deliveryForm.paymentStatus,
        }),
      });
      if (res.status === 401) { void signOut({ callbackUrl: "/login" }); return; }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeliveryError(data.error ?? "Failed to save delivery log.");
        return;
      }

      setDeliverySuccess("Delivery logged successfully.");
      setDeliveryForm({ deliveryKey: "", productType: "can", cansDelivered: "", cansTakenBack: "", caseSize: "", casePrice: "", vehicleId: assignedVehicleId, notes: "", paymentStatus: "cash" });
      setCustomerSearch("");
      // Fire-and-forget so the form frees up immediately; the list refreshes in the background.
      void queryClient.invalidateQueries({ queryKey: ["driver", "supplies"], exact: true });
    } catch {
      setDeliveryError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRegister(e: FormEvent) {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setRegistering(true);

    try {
      const res = await fetch("/api/driver/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          phone: registerForm.phone.trim(),
          email: registerForm.email.trim() || undefined,
          address: registerForm.location.trim(),
          locationType: registerForm.locationType,
          cashPerCan: registerForm.cashPerCan !== "" ? Number(registerForm.cashPerCan) : undefined,
        }),
      });
      if (res.status === 401) { void signOut({ callbackUrl: "/login" }); return; }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setRegisterError(data.error ?? "Failed to register customer.");
        return;
      }

      setRegisterSuccess("Customer registered successfully.");
      setRegisterForm({ name: "", phone: "", email: "", location: "", locationType: "home", cashPerCan: "" });
      void queryClient.invalidateQueries({ queryKey: ["driver", "customers"], exact: true });
    } catch {
      setRegisterError("Network error. Please check your connection and try again.");
    } finally {
      setRegistering(false);
    }
  }

  async function submitCash(e: FormEvent) {
    e.preventDefault();
    setCashError("");
    setCashSuccess("");

    if (cashForm.cashType === "fuel" && !cashBillFile) {
      setCashError("Please attach the fuel bill image.");
      return;
    }
    if (cashBillProcessing) {
      setCashError("Please wait for the image to finish processing.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set("logType", "cash");
    formData.set("amount", String(Number(cashForm.amount)));
    formData.set("cashType", cashForm.cashType);
    formData.set("notes", cashForm.notes);
    if (cashBillFile) formData.set("billImage", cashBillFile);

    try {
      const res = await fetch("/api/driver/supplies", { method: "POST", body: formData });
      if (res.status === 401) { void signOut({ callbackUrl: "/login" }); return; }
      if (res.status === 413) {
        setCashError("Photo is too large. Please retake it or take a screenshot of the bill.");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCashError(data.error ?? "Failed to save cash log.");
        return;
      }

      setCashSuccess("Cash credit logged successfully.");
      setCashForm({ amount: "", cashType: "fuel", notes: "" });
      clearCashBillSelection();
      void queryClient.invalidateQueries({ queryKey: ["driver", "supplies"], exact: true });
    } catch {
      setCashError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const listError = logsQuery.isError;

  return (
    <div>
      <div className="driver-tab-bar">
        <div style={{ display: "flex", minWidth: 0, width: "100%", gap: "0.35rem" }}>
          {([["delivery", "Supply"], ["cash", "Cash"], ["register", "User"]] as const).map(([tab, label]) => (
            <button key={tab} type="button" onClick={() => switchTab(tab)} aria-pressed={activeTab === tab} style={tabButtonStyle(activeTab === tab)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="driver-content">
      {activeTab === "delivery" ? (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Delivery Log</h3>
            {customersQuery.isError && (
              <ErrorWithRetry message="Couldn't load the customer list." onRetry={() => void customersQuery.refetch()} />
            )}
            {vehiclesQuery.isError && (
              <ErrorWithRetry message="Couldn't load the vehicle list." onRetry={() => void vehiclesQuery.refetch()} />
            )}
            <form onSubmit={(e) => void submitDelivery(e)}>
              <div className="grid-2" style={{ marginBottom: "1rem" }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="customerSearch">Customer *</label>
                  <div ref={customerListRef} style={{ position: "relative" }}>
                    <div style={{ position: "relative" }}>
                      <input
                        id="customerSearch"
                        className="form-input"
                        style={{ paddingRight: deliveryForm.deliveryKey ? "2.5rem" : undefined }}
                        value={deliveryForm.deliveryKey ? (selectedDeliveryOption?.label ?? "") : customerSearch}
                        readOnly={!!deliveryForm.deliveryKey}
                        onChange={(e) => {
                          if (deliveryForm.deliveryKey) return;
                          setCustomerSearch(e.target.value);
                          setShowCustomerList(true);
                        }}
                        onFocus={() => { if (!deliveryForm.deliveryKey) setShowCustomerList(true); }}
                        onClick={() => {
                          if (deliveryForm.deliveryKey) {
                            setDeliveryForm((f) => ({ ...f, deliveryKey: "", cansDelivered: "" }));
                            setCustomerSearch("");
                            setShowCustomerList(true);
                          }
                        }}
                        placeholder={customersLoading ? "Loading customers..." : "Search customer..."}
                        autoComplete="off"
                        disabled={customersLoading}
                      />
                      {deliveryForm.deliveryKey && (
                        <button
                          type="button"
                          onClick={() => { setDeliveryForm((f) => ({ ...f, deliveryKey: "", cansDelivered: "" })); setCustomerSearch(""); }}
                          style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1, padding: "0.1rem 0.25rem" }}
                          aria-label="Clear selection"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {showCustomerList && !deliveryForm.deliveryKey && (
                      <div role="listbox" style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--border-active)", borderRadius: "var(--radius-sm)", zIndex: 50, maxHeight: "220px", overflowY: "auto", boxShadow: "var(--shadow-md)" }}>
                        {filteredDeliveryOptions.length > 0 ? filteredDeliveryOptions.map((opt, i) => (
                          <button
                            key={opt.key}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setDeliveryForm((f) => ({ ...f, deliveryKey: opt.key }));
                              setCustomerSearch("");
                              setShowCustomerList(false);
                            }}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              width: "100%", textAlign: "left", padding: "0.65rem 0.875rem",
                              border: "none", borderBottom: i < filteredDeliveryOptions.length - 1 ? "1px solid var(--border)" : "none",
                              background: "transparent", cursor: "pointer", fontSize: "0.9rem", color: "var(--text-primary)",
                            }}
                          >
                            <span>{opt.label}</span>
                            {opt.locationType && (
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "99px", marginLeft: "0.5rem", flexShrink: 0, background: opt.locationType === "home" ? "#e8f5e9" : "#e3f2fd", color: opt.locationType === "home" ? "#2e7d32" : "#1565c0" }}>
                                {opt.locationType === "home" ? "Home" : "Office"}
                              </span>
                            )}
                          </button>
                        )) : (
                          <div style={{ padding: "0.65rem 0.875rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                            {customerSearch ? "No customers found." : "No customers available."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedDeliveryOption && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.3rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <span>Subscription: {selectedDeliveryOption.subscriptionCans} can{selectedDeliveryOption.subscriptionCans !== 1 ? "s" : ""}/day</span>
                      {!isCaseDelivery && selectedDeliveryOption.cashPerCan !== undefined && (
                        <span>Rate: {formatMoney(selectedDeliveryOption.cashPerCan)}/can</span>
                      )}
                    </div>
                  )}
                </div>
                <fieldset className="form-group" style={{ gridColumn: "1 / -1", border: 0, padding: 0, margin: 0 }}>
                  <legend className="form-label">Product *</legend>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                    {(["can", "case"] as const).map((pt) => (
                      <label key={pt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: deliveryForm.productType === pt ? 700 : 500, padding: "0.35rem 0.5rem", minHeight: "44px" }}>
                        <input
                          type="radio"
                          name="productType"
                          value={pt}
                          checked={deliveryForm.productType === pt}
                          // Clear the quantities so a count typed for one product is never saved as the other.
                          onChange={() => setDeliveryForm((f) => ({ ...f, productType: pt, cansDelivered: "", cansTakenBack: "", caseSize: "", casePrice: "" }))}
                        />
                        {pt === "can" ? "Can" : "Case"}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {isCaseDelivery && (
                  <fieldset className="form-group" style={{ gridColumn: "1 / -1", border: 0, padding: 0, margin: 0 }}>
                    <legend className="form-label">Bottle Size *</legend>
                    <div style={{ display: "flex", gap: "0.5rem 1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                      {CASE_SIZES.map((size) => (
                        <label key={size} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: deliveryForm.caseSize === size ? 700 : 500, padding: "0.35rem 0.5rem", minHeight: "44px" }}>
                          <input
                            type="radio"
                            name="caseSize"
                            value={size}
                            checked={deliveryForm.caseSize === size}
                            onChange={() => setDeliveryForm((f) => ({ ...f, caseSize: size }))}
                          />
                          {size}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="cansDelivered">{isCaseDelivery ? "Cases Delivered *" : "Cans Delivered *"}</label>
                  <input
                    id="cansDelivered"
                    className="form-input"
                    type="number"
                    inputMode="numeric"
                    min={isCaseDelivery ? "1" : "0"}
                    step="1"
                    value={deliveryForm.cansDelivered}
                    onChange={(e) => setDeliveryForm((f) => ({ ...f, cansDelivered: e.target.value }))}
                    placeholder={isCaseDelivery ? "e.g. 1" : "e.g. 2"}
                  />
                </div>
                {isCaseDelivery ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="casePrice">Price per Case (₹) *</label>
                    <input
                      id="casePrice"
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={deliveryForm.casePrice}
                      onChange={(e) => setDeliveryForm((f) => ({ ...f, casePrice: e.target.value }))}
                      placeholder="e.g. 120"
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="cansTakenBack">Cans Taken Back</label>
                    <input
                      id="cansTakenBack"
                      className="form-input"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={deliveryForm.cansTakenBack}
                      onChange={(e) => setDeliveryForm((f) => ({ ...f, cansTakenBack: e.target.value }))}
                      placeholder="e.g. 1"
                    />
                  </div>
                )}
                {caseTotalPreview && (
                  <div data-testid="case-total" style={{ gridColumn: "1 / -1", fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "-0.25rem" }}>
                    Amount: <strong style={{ color: "var(--text-primary)" }}>{caseTotalPreview}</strong>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="vehicleId">Vehicle (Optional)</label>
                  <select
                    id="vehicleId"
                    className="form-select"
                    value={deliveryForm.vehicleId}
                    onChange={(e) => setDeliveryForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} - {v.vehicleNumber} ({v.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="deliveryNotes">Notes (Optional)</label>
                  <input
                    id="deliveryNotes"
                    className="form-input"
                    maxLength={1000}
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Customer was away, left at gate"
                  />
                </div>

                <fieldset className="form-group" style={{ gridColumn: "1 / -1", border: 0, padding: 0, margin: 0 }}>
                  <legend className="form-label">Payment Status</legend>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                    {(["cash", "upi", "not_paid"] as const).map((ps) => (
                      <label key={ps} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: deliveryForm.paymentStatus === ps ? 700 : 500, padding: "0.35rem 0.5rem", minHeight: "44px" }}>
                        <input
                          type="radio"
                          name="paymentStatus"
                          value={ps}
                          checked={deliveryForm.paymentStatus === ps}
                          onChange={() => setDeliveryForm((f) => ({ ...f, paymentStatus: ps }))}
                        />
                        {ps === "cash" ? "Cash" : ps === "upi" ? "UPI" : "Not Paid"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              {deliveryError && <div className="alert alert-error" role="alert">{deliveryError}</div>}
              {deliverySuccess && <div className="alert alert-success" role="status">{deliverySuccess}</div>}

              <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                {submitting ? "Saving..." : "Log Delivery"}
              </button>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: "0.4rem" }}>
              <h2>My Recent Deliveries</h2>
              <button
                type="button"
                aria-label={deliveryDateFilter ? "Clear delivery date filter" : "Open delivery date filter"}
                onClick={() => {
                  if (deliveryDateFilter) { setDeliveryDateFilter(""); return; }
                  openDatePicker(deliveryDateInputRef.current);
                }}
                style={calendarButtonStyle}
              >
                <CalendarIcon clear={Boolean(deliveryDateFilter)} />
              </button>
              <input
                ref={deliveryDateInputRef}
                type="date"
                max={maxSelectableDateValue}
                value={deliveryDateFilter}
                onChange={(e) => setDeliveryDateFilter(e.target.value)}
                style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
            {deliveryDateFilter && deliveryDateQuery.isError ? (
              <ErrorWithRetry message="Couldn't load that day's deliveries." onRetry={() => void deliveryDateQuery.refetch()} />
            ) : !deliveryDateFilter && listError ? (
              <ErrorWithRetry message="Couldn't load your recent deliveries." onRetry={() => void logsQuery.refetch()} />
            ) : (deliveryDateFilter ? deliveryDateLoading : logsLoading) ? (
              <p style={{ color: "var(--text-muted)" }}>Loading...</p>
            ) : deliveryDateFilter && visibleDeliveryGroups.length === 0 ? (
              <div className="card empty-state">No deliveries found for selected date.</div>
            ) : !deliveryDateFilter && deliveryLogs.length === 0 ? (
              <div className="card empty-state">No deliveries in the last {RECENT_DAYS} days. Use the calendar to view older days.</div>
            ) : (
              <DeliveryCards groups={visibleDeliveryGroups} onSelect={setSelectedLog} />
            )}
          </div>
        </>
      ) : activeTab === "cash" ? (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Cash Credit Log</h3>
            <form onSubmit={(e) => void submitCash(e)}>
              <div className="grid-2" style={{ marginBottom: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cashAmount">Amount (₹)</label>
                  <input
                    id="cashAmount"
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={cashForm.amount}
                    onChange={(e) => setCashForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cashType">Type</label>
                  <select
                    id="cashType"
                    className="form-select"
                    value={cashForm.cashType}
                    onChange={(e) => {
                      const nextCashType = e.target.value as "debit" | "fuel";
                      setCashForm((f) => ({ ...f, cashType: nextCashType }));
                      if (nextCashType !== "fuel") clearCashBillSelection();
                    }}
                    required
                  >
                    <option value="debit">Debit</option>
                    <option value="fuel">Fuel</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cashRemark">Remark (Optional)</label>
                  <input
                    id="cashRemark"
                    className="form-input"
                    maxLength={1000}
                    value={cashForm.notes}
                    onChange={(e) => setCashForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional remark"
                  />
                </div>

                {cashForm.cashType === "fuel" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="cashBillImage">Fuel Bill Image *</label>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
                      {prefersCameraCapture ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => cashCameraInputRef.current?.click()}
                          >
                            Camera
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => cashBillInputRef.current?.click()}
                          >
                            Gallery
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => cashBillInputRef.current?.click()}
                        >
                          Add Fuel Bill Image
                        </button>
                      )}
                    </div>
                    {/* Gallery / file picker — no capture */}
                    <input
                      ref={cashBillInputRef}
                      id="cashBillImage"
                      type="file"
                      accept="image/*,.heic,.heif,image/heic,image/heif"
                      onChange={(e) => void handleCashBillChange(e)}
                      style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                      tabIndex={-1}
                    />
                    {/* Camera-only picker — mobile only */}
                    {prefersCameraCapture && (
                      <input
                        ref={cashCameraInputRef}
                        type="file"
                        accept="image/*,.heic,.heif,image/heic,image/heif"
                        capture="environment"
                        onChange={(e) => void handleCashBillChange(e)}
                        style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                    )}
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                      {cashBillFile
                        ? `Selected: ${cashBillFile.name}`
                        : "Attach the fuel bill image."}
                    </div>
                    {cashBillProcessing && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                        Optimizing image...
                      </div>
                    )}
                    {cashBillPreview && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <img
                          src={cashBillPreview}
                          alt="Fuel bill preview"
                          style={{ width: "100%", maxWidth: "240px", borderRadius: "10px", border: "1px solid var(--border)" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {cashError && <div className="alert alert-error" role="alert">{cashError}</div>}
              {cashSuccess && <div className="alert alert-success" role="status">{cashSuccess}</div>}

              <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                {submitting ? "Saving..." : "Submit"}
              </button>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: "0.4rem" }}>
              <h2>My Recent Cash Credits</h2>
              <button
                type="button"
                aria-label={cashDateFilter ? "Clear cash date filter" : "Open cash date filter"}
                onClick={() => {
                  if (cashDateFilter) { setCashDateFilter(""); return; }
                  openDatePicker(cashDateInputRef.current);
                }}
                style={calendarButtonStyle}
              >
                <CalendarIcon clear={Boolean(cashDateFilter)} />
              </button>
              <input
                ref={cashDateInputRef}
                type="date"
                max={maxSelectableDateValue}
                value={cashDateFilter}
                onChange={(e) => setCashDateFilter(e.target.value)}
                style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
            {cashDateFilter && cashDateQuery.isError ? (
              <ErrorWithRetry message="Couldn't load that day's cash credits." onRetry={() => void cashDateQuery.refetch()} />
            ) : !cashDateFilter && listError ? (
              <ErrorWithRetry message="Couldn't load your recent cash credits." onRetry={() => void logsQuery.refetch()} />
            ) : (cashDateFilter ? cashDateLoading : logsLoading) ? (
              <p style={{ color: "var(--text-muted)" }}>Loading...</p>
            ) : cashDateFilter && visibleCashGroups.length === 0 ? (
              <div className="card empty-state">No cash logs found for selected date.</div>
            ) : !cashDateFilter && cashLogs.length === 0 ? (
              <div className="card empty-state">No cash credits in the last {RECENT_DAYS} days. Use the calendar to view older days.</div>
            ) : (
              <CashCards groups={visibleCashGroups} onSelect={setSelectedLog} />
            )}
          </div>
        </>
      ) : activeTab === "register" ? (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.25rem" }}>Register New Customer</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Registered customers can be selected for deliveries.
          </p>
          <form onSubmit={(e) => void submitRegister(e)}>
            <div className="grid-2" style={{ marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="regName">Name *</label>
                <input
                  id="regName"
                  className="form-input"
                  maxLength={120}
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="regPhone">Phone *</label>
                <input
                  id="regPhone"
                  className="form-input"
                  type="tel"
                  maxLength={30}
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Mobile number"
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="regEmail">Gmail / Email (Optional)</label>
                <input
                  id="regEmail"
                  className="form-input"
                  type="email"
                  maxLength={120}
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="customer@gmail.com"
                />
              </div>
              <fieldset className="form-group" style={{ gridColumn: "1 / -1", border: 0, padding: 0, margin: 0 }}>
                <legend className="form-label">Type *</legend>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  {(["home", "office", "both"] as const).map((lt) => (
                    <label key={lt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: registerForm.locationType === lt ? 700 : 500, padding: "0.35rem 0", minHeight: "44px" }}>
                      <input
                        type="radio"
                        name="regLocationType"
                        value={lt}
                        checked={registerForm.locationType === lt}
                        onChange={() => setRegisterForm((f) => ({ ...f, locationType: lt }))}
                      />
                      {lt === "home" ? "Home" : lt === "office" ? "Office" : "Both"}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="regLocation">Location *</label>
                <input
                  id="regLocation"
                  className="form-input"
                  maxLength={500}
                  value={registerForm.location}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Address or landmark"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="regCashPerCan">Cash Per Can (₹) *</label>
                <input
                  id="regCashPerCan"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={registerForm.cashPerCan}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, cashPerCan: e.target.value }))}
                  placeholder="e.g. 50"
                  required
                />
              </div>
            </div>

            {registerError && <div className="alert alert-error" role="alert">{registerError}</div>}
            {registerSuccess && <div className="alert alert-success" role="status">{registerSuccess}</div>}

            <button type="submit" className="btn btn-primary mt-2" disabled={registering}>
              {registering ? "Registering..." : "Register Customer"}
            </button>
          </form>
        </div>
      ) : null}
      </div>

      {selectedLog && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", zIndex: 200,
          }}
          onClick={() => { setSelectedLog(null); setDetailError(""); }}
        >
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logDetailsTitle"
            style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3 id="logDetailsTitle">{selectedLog.logType === "cash" ? "Cash Credit Details" : "Delivery Details"}</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setSelectedLog(null); setDetailError(""); }}>
                Close
              </button>
            </div>

            {selectedLog.logType === "cash" ? (
              <div className="flex-col gap-2">
                <div>
                  <div className="text-sm text-muted">Date & Time</div>
                  <div style={{ fontWeight: 600 }}>{formatDateTime(selectedLog.suppliedAt)}</div>
                </div>
                {selectedLog.amount !== undefined && (
                  <div>
                    <div className="text-sm text-muted">Amount</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(selectedLog.amount)}</div>
                  </div>
                )}
                {selectedLog.cashType && (
                  <div>
                    <div className="text-sm text-muted">Type</div>
                    <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{selectedLog.cashType}</div>
                  </div>
                )}
                {selectedLog.notes && (
                  <div>
                    <div className="text-sm text-muted">Remark</div>
                    <div style={{ fontWeight: 500 }}>{selectedLog.notes}</div>
                  </div>
                )}
                {selectedLog.cashType === "fuel" && selectedLog.billImageUrl && (
                  <div>
                    <div className="text-sm text-muted">Fuel Bill Image</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <button
                        type="button"
                        onClick={() => setExpandedImageUrl(selectedLog.billImageUrl ?? null)}
                        aria-label="View the fuel bill at full size"
                        style={{ border: "0", background: "transparent", padding: 0, cursor: "zoom-in", width: "fit-content" }}
                      >
                        <img
                          src={cloudinaryThumb(selectedLog.billImageUrl, 640)}
                          alt="Fuel bill"
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
                          View full image
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void downloadImageToDevice(selectedLog.billImageUrl)}
                          style={{ width: "fit-content" }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-col gap-2">
                <div>
                  <div className="text-sm text-muted">Date & Time</div>
                  <div style={{ fontWeight: 600 }}>{formatDateTime(selectedLog.suppliedAt)}</div>
                </div>
                {(selectedLog.customer?.name || selectedLog.pointName) && (
                  <div>
                    <div className="text-sm text-muted">Customer</div>
                    <div style={{ fontWeight: 600 }}>{selectedLog.customer?.name ?? selectedLog.pointName}</div>
                    {selectedLog.customer?.phone && (
                      <div className="text-sm text-muted">{selectedLog.customer.phone}</div>
                    )}
                    {selectedLog.customer?.area && (
                      <div className="text-sm text-muted">{selectedLog.customer.area}</div>
                    )}
                  </div>
                )}
                {deliveredText(selectedLog) && (
                  <div>
                    <div className="text-sm text-muted">{selectedLog.productType === "case" ? "Cases Delivered" : "Cans Delivered"}</div>
                    <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>
                      {deliveredText(selectedLog)}
                    </div>
                  </div>
                )}
                {selectedLog.productType === "case" && selectedLog.casePrice !== undefined && (
                  <div>
                    <div className="text-sm text-muted">Price per Case</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(selectedLog.casePrice)}</div>
                  </div>
                )}
                {selectedLog.cansTakenBack !== undefined && (
                  <div>
                    <div className="text-sm text-muted">Cans Taken Back</div>
                    <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>
                      {selectedLog.cansTakenBack} can{selectedLog.cansTakenBack !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
                {selectedLog.amount !== undefined && (
                  <div>
                    <div className="text-sm text-muted">Amount</div>
                    <div style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{formatMoney(selectedLog.amount)}</div>
                  </div>
                )}
                {selectedLog.vehicle && (
                  <div>
                    <div className="text-sm text-muted">Vehicle</div>
                    <div style={{ fontWeight: 600 }}>
                      {[selectedLog.vehicle.name, selectedLog.vehicle.vehicleNumber, selectedLog.vehicle.capacity].filter(Boolean).join(" - ")}
                    </div>
                  </div>
                )}
                {selectedLog.paymentStatus && (
                  <div>
                    <div className="text-sm text-muted">Payment Status</div>
                    <div style={{ fontWeight: 600 }}>
                      {selectedLog.paymentStatus === "cash" ? "Cash" : selectedLog.paymentStatus === "upi" ? "UPI" : "Not Paid"}
                    </div>
                  </div>
                )}
                {selectedLog.notes && (
                  <div>
                    <div className="text-sm text-muted">Notes</div>
                    <div style={{ fontWeight: 500 }}>{selectedLog.notes}</div>
                  </div>
                )}
              </div>
            )}
            {detailError && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{detailError}</div>}
          </div>
        </div>
      )}

      {expandedImageUrl && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", zIndex: 300,
          }}
          onClick={() => setExpandedImageUrl(null)}
        >
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fuelBillPreviewTitle"
            style={{ width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 id="fuelBillPreviewTitle">Fuel Bill Preview</h3>
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
    </div>
  );
}
