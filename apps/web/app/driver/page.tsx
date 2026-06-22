"use client";

/* eslint-disable @next/next/no-img-element */
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  subscriptionCans: number;
  cashPerCan?: number;
}

interface DeliveryLog {
  _id: string;
  suppliedAt: string;
  formattedSuppliedAt?: string;
  pointName?: string;
  cansDelivered?: number;
  notes?: string;
  amount?: number;
  logType?: "water" | "cash";
  cashType?: "debit" | "fuel";
  billImageUrl?: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
    area?: string;
  };
  vehicle?: Vehicle;
}

interface GroupedLogs {
  key: string;
  label: string;
  dateInputValue: string;
  dateSortValue: number;
  entries: Array<DeliveryLog & { serialNo: number }>;
}

interface DriverVehiclesResponse {
  vehicles: Vehicle[];
  assignedVehicleId: string | null;
}

function formatDateHeading(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function toDateInputValue(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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

const DAY_GROUPS_PER_PAGE = 3;

export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState<"delivery" | "cash" | "register">("delivery");

  // Vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignedVehicleId, setAssignedVehicleId] = useState("");

  // Logs and UI state
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [cashDateFilter, setCashDateFilter] = useState("");
  const deliveryDateInputRef = useRef<HTMLInputElement | null>(null);
  const cashDateInputRef = useRef<HTMLInputElement | null>(null);

  // Delivery form
  const [deliveryForm, setDeliveryForm] = useState({
    customerId: "",
    cansDelivered: "",
    vehicleId: "",
    notes: "",
  });

  // Register customer form
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    locationType: "home" as "home" | "office",
    cashPerCan: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registering, setRegistering] = useState(false);

  // Cash form
  const [cashForm, setCashForm] = useState({
    amount: "",
    cashType: "debit" as "debit" | "fuel",
    notes: "",
  });
  const [cashBillFile, setCashBillFile] = useState<File | null>(null);
  const [cashBillPreview, setCashBillPreview] = useState("");
  const [cashBillProcessing, setCashBillProcessing] = useState(false);
  const cashBillInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery<DriverVehiclesResponse>({
    queryKey: ["driver", "vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/driver/vehicles", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load vehicles");
      const data = (await res.json()) as DriverVehiclesResponse;
      return {
        vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
        assignedVehicleId: data.assignedVehicleId ?? null,
      };
    },
  });

  const { data: customersData, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["driver", "customers"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch("/api/driver/customers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load customers");
      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as Customer[]) : [];
    },
  });

  const { data: logsData, isLoading: logsLoading } = useQuery<DeliveryLog[]>({
    queryKey: ["driver", "supplies"],
    queryFn: async () => {
      const res = await fetch("/api/driver/supplies", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load logs");
      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as DeliveryLog[]) : [];
    },
  });

  useEffect(() => {
    if (vehiclesData) {
      setVehicles(vehiclesData.vehicles);
      const nextId =
        vehiclesData.assignedVehicleId &&
        vehiclesData.vehicles.some((v) => v._id === vehiclesData.assignedVehicleId)
          ? vehiclesData.assignedVehicleId
          : "";
      setAssignedVehicleId(nextId);
      setDeliveryForm((f) => (f.vehicleId ? f : { ...f, vehicleId: nextId }));
    }
  }, [vehiclesData]);

  // Auto-fill cans from selected customer's subscription
  useEffect(() => {
    if (deliveryForm.customerId && customersData) {
      const customer = customersData.find((c) => c._id === deliveryForm.customerId);
      if (customer) {
        setDeliveryForm((f) => ({
          ...f,
          cansDelivered: String(customer.subscriptionCans),
        }));
      }
    }
  }, [deliveryForm.customerId, customersData]);

  useEffect(() => {
    if (logsData) {
      setLogs(
        logsData.map((log) => ({
          ...log,
          logType: log.logType === "cash" ? "cash" : "water",
          formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
        })),
      );
    }
  }, [logsData]);

  const deliveryLogs = useMemo(
    () => logs.filter((log) => (log.logType ?? "water") === "water"),
    [logs],
  );
  const cashLogs = useMemo(
    () => logs.filter((log) => log.logType === "cash"),
    [logs],
  );

  function buildGroupedLogs(source: DeliveryLog[]): GroupedLogs[] {
    const serialById = new Map(
      [...source]
        .sort((a, b) => new Date(b.suppliedAt).getTime() - new Date(a.suppliedAt).getTime())
        .map((log, index) => [log._id, index + 1] as const),
    );

    const map = new Map<string, DeliveryLog[]>();
    for (const log of source) {
      const key = new Date(log.suppliedAt).toDateString();
      const existing = map.get(key) ?? [];
      existing.push(log);
      map.set(key, existing);
    }

    return Array.from(map.entries())
      .map(([key, entries]) => ({
        key,
        label: getRelativeDayLabel(entries[0]?.suppliedAt ?? new Date().toISOString()),
        dateInputValue: toDateInputValue(entries[0]?.suppliedAt ?? new Date()),
        dateSortValue: new Date(entries[0]?.suppliedAt ?? 0).getTime(),
        entries: entries
          .sort((a, b) => new Date(b.suppliedAt).getTime() - new Date(a.suppliedAt).getTime())
          .map((entry) => ({ ...entry, serialNo: serialById.get(entry._id) ?? 0 })),
      }))
      .sort((a, b) => b.dateSortValue - a.dateSortValue);
  }

  const groupedDeliveryLogs = useMemo(() => buildGroupedLogs(deliveryLogs), [deliveryLogs]);
  const groupedCashLogs = useMemo(() => buildGroupedLogs(cashLogs), [cashLogs]);

  const maxSelectableDateValue = toDateInputValue(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));

  const visibleDeliveryGroups = useMemo(() => {
    if (deliveryDateFilter) {
      return groupedDeliveryLogs.filter((g) => g.dateInputValue === deliveryDateFilter).slice(0, 1);
    }
    return groupedDeliveryLogs.slice(0, DAY_GROUPS_PER_PAGE);
  }, [groupedDeliveryLogs, deliveryDateFilter]);

  const visibleCashGroups = useMemo(() => {
    if (cashDateFilter) {
      return groupedCashLogs.filter((g) => g.dateInputValue === cashDateFilter).slice(0, 1);
    }
    return groupedCashLogs.slice(0, DAY_GROUPS_PER_PAGE);
  }, [cashDateFilter, groupedCashLogs]);

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

  function clearCashBillSelection() {
    if (cashBillPreview.startsWith("blob:")) URL.revokeObjectURL(cashBillPreview);
    if (cashBillInputRef.current) cashBillInputRef.current.value = "";
    setCashBillPreview("");
    setCashBillFile(null);
  }

  async function handleCashBillChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) { clearCashBillSelection(); return; }
    setError("");
    setCashBillProcessing(true);
    try {
      const compressedFile = await compressImageFile(selectedFile);
      if (cashBillPreview.startsWith("blob:")) URL.revokeObjectURL(cashBillPreview);
      setCashBillFile(compressedFile);
      setCashBillPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      clearCashBillSelection();
      setError(err instanceof Error ? err.message : "Failed to process the image.");
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
      setError("Couldn't start the download automatically. The image was opened in a new tab.");
    }
  }

  async function submitDelivery(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const res = await fetch("/api/driver/supplies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logType: "water",
        customerId: deliveryForm.customerId,
        cansDelivered: Number(deliveryForm.cansDelivered),
        vehicleId: deliveryForm.vehicleId || undefined,
        notes: deliveryForm.notes,
      }),
    });

    let data: { error?: string } = {};
    try { data = (await res.json()) as { error?: string }; } catch { /* ignore */ }
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save delivery log.");
      return;
    }

    setSuccess("Delivery logged successfully.");
    setDeliveryForm({ customerId: "", cansDelivered: "", vehicleId: assignedVehicleId, notes: "" });
    await queryClient.invalidateQueries({ queryKey: ["driver", "supplies"] });
  }

  async function submitRegister(e: FormEvent) {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setRegistering(true);

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

    let data: { error?: string } = {};
    try { data = (await res.json()) as { error?: string }; } catch { /* ignore */ }
    setRegistering(false);

    if (!res.ok) {
      setRegisterError(data.error ?? "Failed to register customer.");
      return;
    }

    setRegisterSuccess("Customer registered successfully.");
    setRegisterForm({ name: "", phone: "", email: "", location: "", locationType: "home", cashPerCan: "" });
    await queryClient.invalidateQueries({ queryKey: ["driver", "customers"] });
  }

  async function submitCash(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (cashForm.cashType === "fuel" && !cashBillFile) {
      setError("Please attach the fuel bill image.");
      return;
    }
    if (cashBillProcessing) {
      setError("Please wait for the image to finish processing.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set("logType", "cash");
    formData.set("amount", String(Number(cashForm.amount)));
    formData.set("cashType", cashForm.cashType);
    formData.set("notes", cashForm.notes);
    if (cashBillFile) formData.set("billImage", cashBillFile);

    const res = await fetch("/api/driver/supplies", { method: "POST", body: formData });

    let data: { error?: string } = {};
    try { data = (await res.json()) as { error?: string }; } catch { /* ignore */ }
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save cash log.");
      return;
    }

    setSuccess("Cash credit logged successfully.");
    setCashForm({ amount: "", cashType: "debit", notes: "" });
    clearCashBillSelection();
    await queryClient.invalidateQueries({ queryKey: ["driver", "supplies"] });
  }

  const isLoading = vehiclesLoading || customersLoading || logsLoading;

  return (
    <div>
      <div
        style={{
          marginBottom: "1rem",
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
            onClick={() => setActiveTab("delivery")}
            style={{
              borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0,
              borderRadius: "12px",
              background: activeTab === "delivery" ? "var(--accent-primary)" : "#f3f4f6",
              padding: "0.65rem 0.9rem",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              color: activeTab === "delivery" ? "#ffffff" : "#111827",
              flex: 1,
            }}
          >
            Delivery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cash")}
            style={{
              borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0,
              borderRadius: "12px",
              background: activeTab === "cash" ? "var(--accent-primary)" : "#f3f4f6",
              padding: "0.65rem 0.9rem",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              color: activeTab === "cash" ? "#ffffff" : "#111827",
              flex: 1,
            }}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            style={{
              borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0,
              borderRadius: "12px",
              background: activeTab === "register" ? "var(--accent-primary)" : "#f3f4f6",
              padding: "0.65rem 0.9rem",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              color: activeTab === "register" ? "#ffffff" : "#111827",
              flex: 1,
            }}
          >
            Register
          </button>
        </div>
      </div>

      {activeTab === "delivery" ? (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Delivery Log</h3>
            <form onSubmit={(e) => void submitDelivery(e)}>
              <div className="grid-2" style={{ marginBottom: "1rem" }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="customerId">Customer *</label>
                  <select
                    id="customerId"
                    className="form-select"
                    value={deliveryForm.customerId}
                    onChange={(e) => setDeliveryForm((f) => ({ ...f, customerId: e.target.value }))}
                    required
                    disabled={customersLoading}
                  >
                    <option value="">{customersLoading ? "Loading customers..." : "Select customer"}</option>
                    {(customersData ?? []).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}{c.area ? ` — ${c.area}` : ""}{c.phone ? ` (${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                  {deliveryForm.customerId && customersData && (() => {
                    const c = customersData.find((x) => x._id === deliveryForm.customerId);
                    return c ? (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.3rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <span>Subscription: {c.subscriptionCans} can{c.subscriptionCans !== 1 ? "s" : ""}/day</span>
                        {c.cashPerCan !== undefined && (
                          <span>Rate: ₹{c.cashPerCan}/can</span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cansDelivered">Cans Delivered *</label>
                  <input
                    id="cansDelivered"
                    className="form-input"
                    type="number"
                    min="1"
                    step="1"
                    value={deliveryForm.cansDelivered}
                    onChange={(e) => setDeliveryForm((f) => ({ ...f, cansDelivered: e.target.value }))}
                    placeholder="e.g. 2"
                    required
                  />
                </div>
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
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Customer was away, left at gate"
                  />
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

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
                aria-label="Open delivery date filter"
                onClick={() => {
                  if (deliveryDateFilter) { setDeliveryDateFilter(""); return; }
                  openDatePicker(deliveryDateInputRef.current);
                }}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  border: "1px solid #ffffff",
                  background: "var(--accent-primary)", color: "#ffffff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                {deliveryDateFilter ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 2v4" /><path d="M16 2v4" />
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" />
                  </svg>
                )}
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
            {isLoading ? (
              <p style={{ color: "var(--text-muted)" }}>Loading...</p>
            ) : deliveryLogs.length === 0 ? (
              <div className="card empty-state">No delivery logs yet.</div>
            ) : deliveryDateFilter && visibleDeliveryGroups.length === 0 ? (
              <div className="card empty-state">No deliveries found for selected date.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {visibleDeliveryGroups.map((group) => (
                  <div key={group.key}>
                    <h3 style={{ marginBottom: "0.6rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                      {group.label}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {group.entries.map((log) => (
                        <button
                          key={log._id}
                          type="button"
                          className="card"
                          onClick={() => setSelectedLog(log)}
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
                            {log.cansDelivered !== undefined && (
                              <div style={{
                                background: "var(--accent-primary)", color: "#fff",
                                borderRadius: "20px", padding: "0.15rem 0.65rem",
                                fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap",
                              }}>
                                {log.cansDelivered} can{log.cansDelivered !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                          {log.customer?.area && (
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{log.customer.area}</div>
                          )}
                          {log.amount !== undefined && (
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              Amount: <strong>₹{log.amount}</strong>
                            </div>
                          )}
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                  <label className="form-label" htmlFor="cashAmount">Amount</label>
                  <input
                    id="cashAmount"
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
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
                    value={cashForm.notes}
                    onChange={(e) => setCashForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional remark"
                  />
                </div>

                {cashForm.cashType === "fuel" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="cashBillImage">Fuel Bill Image *</label>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => cashBillInputRef.current?.click()}
                      >
                        Add Fuel Bill Image
                      </button>
                    </div>
                    <input
                      ref={cashBillInputRef}
                      id="cashBillImage"
                      className="form-input"
                      type="file"
                      accept="image/*,.heic,.heif,image/heic,image/heif"
                      capture={prefersCameraCapture ? "environment" : undefined}
                      onChange={(e) => void handleCashBillChange(e)}
                      style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                      tabIndex={-1}
                    />
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                      {cashBillFile
                        ? `Selected: ${cashBillFile.name}`
                        : prefersCameraCapture
                          ? "On phone, this will try to open the camera first."
                          : "Choose the fuel bill image from your device."}
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

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

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
                aria-label="Open cash date filter"
                onClick={() => {
                  if (cashDateFilter) { setCashDateFilter(""); return; }
                  openDatePicker(cashDateInputRef.current);
                }}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  border: "1px solid #ffffff",
                  background: "var(--accent-primary)", color: "#ffffff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                {cashDateFilter ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 2v4" /><path d="M16 2v4" />
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" />
                  </svg>
                )}
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
            {logsLoading ? (
              <p style={{ color: "var(--text-muted)" }}>Loading...</p>
            ) : cashLogs.length === 0 ? (
              <div className="card empty-state">No cash credit logs yet.</div>
            ) : cashDateFilter && visibleCashGroups.length === 0 ? (
              <div className="card empty-state">No cash logs found for selected date.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {visibleCashGroups.map((group) => (
                  <div key={group.key}>
                    <h3 style={{ marginBottom: "0.6rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                      {group.label}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {group.entries.map((log) => (
                        <button
                          key={log._id}
                          type="button"
                          className="card"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            textAlign: "left", cursor: "pointer",
                            border: "1px solid var(--border)",
                            display: "flex", flexDirection: "column", gap: "0.35rem",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {log.serialNo}. Amount: {log.amount ?? "-"}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                            {log.cashType ?? "-"}
                          </div>
                          {log.billImageUrl && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.25rem" }}>
                              <img
                                src={log.billImageUrl}
                                alt="Fuel bill preview"
                                style={{
                                  width: "52px", height: "52px", objectFit: "cover",
                                  borderRadius: "8px", border: "1px solid var(--border)",
                                }}
                              />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="customer@gmail.com"
                />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Type *</label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.4rem" }}>
                  {(["home", "office"] as const).map((lt) => (
                    <label key={lt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: registerForm.locationType === lt ? 700 : 500 }}>
                      <input
                        type="radio"
                        name="regLocationType"
                        value={lt}
                        checked={registerForm.locationType === lt}
                        onChange={() => setRegisterForm((f) => ({ ...f, locationType: lt }))}
                      />
                      {lt === "home" ? "Home" : "Office"}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="regLocation">Location *</label>
                <input
                  id="regLocation"
                  className="form-input"
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
                  value={registerForm.cashPerCan}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, cashPerCan: e.target.value }))}
                  placeholder="e.g. 50"
                  required
                />
              </div>
            </div>

            {registerError && <div className="alert alert-error">{registerError}</div>}
            {registerSuccess && <div className="alert alert-success">{registerSuccess}</div>}

            <button type="submit" className="btn btn-primary mt-2" disabled={registering}>
              {registering ? "Registering..." : "Register Customer"}
            </button>
          </form>
        </div>
      ) : null}

      {selectedLog && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", zIndex: 200,
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>{selectedLog.logType === "cash" ? "Cash Credit Details" : "Delivery Details"}</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedLog(null)}>
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
                    <div style={{ fontWeight: 600 }}>₹{selectedLog.amount}</div>
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
                        style={{ border: "0", background: "transparent", padding: 0, cursor: "zoom-in", width: "fit-content" }}
                      >
                        <img
                          src={selectedLog.billImageUrl}
                          alt="Fuel bill"
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
                {selectedLog.cansDelivered !== undefined && (
                  <div>
                    <div className="text-sm text-muted">Cans Delivered</div>
                    <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>
                      {selectedLog.cansDelivered} can{selectedLog.cansDelivered !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
                {selectedLog.amount !== undefined && (
                  <div>
                    <div className="text-sm text-muted">Amount</div>
                    <div style={{ fontWeight: 700, color: "var(--accent-primary)" }}>₹{selectedLog.amount}</div>
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
                {selectedLog.notes && (
                  <div>
                    <div className="text-sm text-muted">Notes</div>
                    <div style={{ fontWeight: 500 }}>{selectedLog.notes}</div>
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
}
