"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyDelivery { date: string; count: number; totalCans: number; }
interface DailyRegistration { date: string; count: number; }
interface AnalyticsData { deliveries: DailyDelivery[]; registrations: DailyRegistration[]; }
interface Driver { _id: string; name: string; username: string; }
interface VehicleItem { _id: string; name: string; vehicleNumber: string; }

interface FilterState {
  dateMode: "quick" | "custom";
  quickDays: number;
  from: string;
  to: string;
  driverId: string;
  vehicleId: string;
}

const DEFAULT_FILTERS: FilterState = {
  dateMode: "quick",
  quickDays: 30,
  from: "",
  to: "",
  driverId: "",
  vehicleId: "",
};

const QUICK_DAYS = [7, 14, 30, 90] as const;

function buildQuery(f: FilterState): string {
  const p = new URLSearchParams();
  if (f.dateMode === "custom" && f.from && f.to) {
    p.set("from", f.from);
    p.set("to", f.to);
  } else {
    p.set("days", String(f.quickDays));
  }
  if (f.driverId) p.set("driverId", f.driverId);
  if (f.vehicleId) p.set("vehicleId", f.vehicleId);
  return p.toString();
}

function activeCount(f: FilterState): number {
  let n = 0;
  if (f.dateMode === "custom" && f.from && f.to) n++;
  if (f.driverId) n++;
  if (f.vehicleId) n++;
  return n;
}

function formatDateDisplay(s: string): string {
  const [y, m, d] = s.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

function periodLabel(f: FilterState): string {
  if (f.dateMode === "custom" && f.from && f.to) {
    return `${formatDateDisplay(f.from)} – ${formatDateDisplay(f.to)}`;
  }
  return `Last ${f.quickDays} days`;
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color,
  gradientId,
}: {
  data: Array<{ date: string; value: number }>;
  color: string;
  gradientId: string;
}) {
  const W = 580, H = 170, PL = 38, PR = 8, PT = 14, PB = 30;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const slotW = chartW / Math.max(n, 1);
  const barW = Math.max(2, slotW * 0.65);

  const yTicks = useMemo(() => {
    const nice = Math.ceil(maxVal / 4) * 4;
    return [0, Math.round(nice / 2), nice];
  }, [maxVal]);

  const interval = n <= 7 ? 1 : n <= 14 ? 2 : 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {yTicks.map((tick) => {
        const y = PT + chartH - (tick / Math.max(...yTicks, 1)) * chartH;
        return (
          <g key={tick}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 5} y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">{tick}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = Math.max(0, (d.value / Math.max(...yTicks, 1)) * chartH);
        const x = PL + i * slotW + (slotW - barW) / 2;
        const y = PT + chartH - barH;
        return <rect key={d.date} x={x} y={y} width={barW} height={barH} fill={`url(#${gradientId})`} rx="2" />;
      })}
      {data.map((d, i) => {
        if (i % interval !== 0 && i !== n - 1) return null;
        const x = PL + i * slotW + slotW / 2;
        return (
          <text key={d.date} x={x} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#94a3b8">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({
  data,
  color,
  gradientId,
}: {
  data: Array<{ date: string; value: number }>;
  color: string;
  gradientId: string;
}) {
  const W = 580, H = 170, PL = 38, PR = 8, PT = 14, PB = 30;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;

  const yTicks = useMemo(() => {
    const nice = Math.ceil(maxVal / 4) * 4;
    return [0, Math.round(nice / 2), nice];
  }, [maxVal]);

  const points = data.map((d, i) => ({
    x: PL + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW),
    y: PT + chartH - (d.value / Math.max(...yTicks, 1)) * chartH,
    date: d.date,
    value: d.value,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = last && first
    ? `${linePath} L ${last.x.toFixed(1)} ${(PT + chartH).toFixed(1)} L ${first.x.toFixed(1)} ${(PT + chartH).toFixed(1)} Z`
    : "";

  const interval = n <= 7 ? 1 : n <= 14 ? 2 : 5;
  const dotR = n <= 14 ? 3 : 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((tick) => {
        const y = PT + chartH - (tick / Math.max(...yTicks, 1)) * chartH;
        return (
          <g key={tick}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 5} y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">{tick}</text>
          </g>
        );
      })}
      {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <circle key={p.date} cx={p.x} cy={p.y} r={dotR} fill={color} />
      ))}
      {data.map((d, i) => {
        if (i % interval !== 0 && i !== n - 1) return null;
        const p = points[i];
        if (!p) return null;
        return (
          <text key={d.date} x={p.x} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#94a3b8">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card" style={{ padding: "1rem 1.25rem", borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
        {value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Filter Modal ──────────────────────────────────────────────────────────────

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 2.2rem 0.6rem 0.75rem",
  border: "1.5px solid var(--border)",
  borderRadius: "8px",
  fontSize: "0.9rem",
  outline: "none",
  background: "#fff",
  color: "var(--text-primary)",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.75rem center",
  cursor: "pointer",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  border: "1.5px solid var(--border)",
  borderRadius: "8px",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
  color: "var(--text-primary)",
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  color: "var(--text-muted)",
  marginBottom: "0.65rem",
};

function FilterModal({
  draft,
  setDraft,
  onApply,
  onClose,
  drivers,
  vehicles,
}: {
  draft: FilterState;
  setDraft: (f: FilterState) => void;
  onApply: () => void;
  onClose: () => void;
  drivers: Driver[];
  vehicles: VehicleItem[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  const canApply = draft.dateMode === "quick" || (draft.dateMode === "custom" && !!draft.from && !!draft.to);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff",
        borderRadius: "20px 20px 0 0",
        width: "100%",
        maxWidth: "520px",
        padding: "1.5rem 1.5rem 2rem",
        maxHeight: "88vh",
        overflowY: "auto",
      }}>
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>Filters</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--text-muted)", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Section: Date Range ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={SECTION_LABEL_STYLE}>Date Range</div>

          {/* Quick day pills */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {QUICK_DAYS.map((d) => {
              const active = draft.dateMode === "quick" && draft.quickDays === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDraft({ ...draft, dateMode: "quick", quickDays: d })}
                  style={{
                    border: active ? "2px solid var(--accent-primary)" : "1.5px solid var(--border)",
                    borderRadius: "20px",
                    padding: "0.35rem 0.9rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: active ? "var(--accent-primary)" : "#fff",
                    color: active ? "#fff" : "var(--text-secondary)",
                    transition: "all 0.15s",
                  }}
                >
                  Last {d} days
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setDraft({ ...draft, dateMode: "custom" })}
              style={{
                border: draft.dateMode === "custom" ? "2px solid var(--accent-primary)" : "1.5px solid var(--border)",
                borderRadius: "20px",
                padding: "0.35rem 0.9rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                background: draft.dateMode === "custom" ? "var(--accent-primary)" : "#fff",
                color: draft.dateMode === "custom" ? "#fff" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              Custom range
            </button>
          </div>

          {/* Custom date pickers */}
          {draft.dateMode === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>From</label>
                <input
                  type="date"
                  value={draft.from}
                  max={draft.to || today}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>To</label>
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from}
                  max={today}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Driver ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={SECTION_LABEL_STYLE}>Driver</div>
          <select
            value={draft.driverId}
            onChange={(e) => setDraft({ ...draft, driverId: e.target.value })}
            style={SELECT_STYLE}
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* ── Section: Vehicle ── */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={SECTION_LABEL_STYLE}>Vehicle</div>
          <select
            value={draft.vehicleId}
            onChange={(e) => setDraft({ ...draft, vehicleId: e.target.value })}
            style={SELECT_STYLE}
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>{v.name} · {v.vehicleNumber}</option>
            ))}
          </select>
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_FILTERS)}
            style={{
              flex: 1, padding: "0.75rem", border: "1.5px solid var(--border)",
              borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700,
              cursor: "pointer", background: "#fff", color: "var(--text-secondary)",
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!canApply}
            style={{
              flex: 2, padding: "0.75rem", border: "none",
              borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700,
              cursor: canApply ? "pointer" : "not-allowed",
              background: canApply ? "var(--accent-primary)" : "#e2e8f0",
              color: canApply ? "#fff" : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function Chip({
  children,
  bg,
  color,
  onRemove,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  onRemove?: () => void;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.28rem 0.65rem", borderRadius: "20px",
      background: bg, fontSize: "0.8rem", fontWeight: 600, color,
    }}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color, lineHeight: 1, opacity: 0.7 }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ── Analytics Page ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(DEFAULT_FILTERS);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);

  // Fetch dropdown data once
  useEffect(() => {
    void fetch("/api/admin/drivers")
      .then((r) => r.json())
      .then((d: Driver[]) => setDrivers(Array.isArray(d) ? d : []))
      .catch(() => {});
    void fetch("/api/admin/vehicles")
      .then((r) => r.json())
      .then((v: VehicleItem[]) => setVehicles(Array.isArray(v) ? v : []))
      .catch(() => {});
  }, []);

  const loadAnalytics = useCallback(async (f: FilterState) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?${buildQuery(f)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as AnalyticsData;
      setData(json);
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(filters);
  }, [filters, loadAnalytics]);

  function openModal() {
    setDraft(filters);
    setModalOpen(true);
  }

  function applyFilters() {
    setFilters(draft);
    setModalOpen(false);
  }

  const numActive = activeCount(filters);

  const driverName = useMemo(
    () => drivers.find((d) => d._id === filters.driverId)?.name ?? "",
    [drivers, filters.driverId],
  );
  const vehicleLabel = useMemo(() => {
    const v = vehicles.find((v) => v._id === filters.vehicleId);
    return v ? `${v.name} · ${v.vehicleNumber}` : "";
  }, [vehicles, filters.vehicleId]);

  const totals = useMemo(() => {
    if (!data) return { deliveries: 0, cans: 0, customers: 0 };
    return {
      deliveries: data.deliveries.reduce((s, d) => s + d.count, 0),
      cans: data.deliveries.reduce((s, d) => s + d.totalCans, 0),
      customers: data.registrations.reduce((s, r) => s + r.count, 0),
    };
  }, [data]);

  const deliveryChartData = useMemo(
    () => (data?.deliveries ?? []).map((d) => ({ date: d.date, value: d.count })),
    [data],
  );
  const cansChartData = useMemo(
    () => (data?.deliveries ?? []).map((d) => ({ date: d.date, value: d.totalCans })),
    [data],
  );
  const registrationChartData = useMemo(
    () => (data?.registrations ?? []).map((r) => ({ date: r.date, value: r.count })),
    [data],
  );

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <h1>Analytics</h1>
        <button
          type="button"
          onClick={openModal}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1rem",
            border: numActive > 0 ? "none" : "1.5px solid var(--border)",
            borderRadius: "10px",
            background: numActive > 0 ? "var(--accent-primary)" : "#fff",
            color: numActive > 0 ? "#fff" : "var(--text-secondary)",
            fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            transition: "all 0.15s",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
          {numActive > 0 && (
            <span style={{
              background: "rgba(255,255,255,0.25)", color: "#fff",
              borderRadius: "20px", padding: "0 6px",
              fontSize: "0.72rem", fontWeight: 800, lineHeight: "18px",
              minWidth: "18px", textAlign: "center",
            }}>
              {numActive}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        {/* Period — always shown */}
        <Chip bg="#eef2f7" color="var(--text-secondary)"
          onRemove={filters.dateMode === "custom" ? () => setFilters({ ...filters, dateMode: "quick" }) : undefined}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {periodLabel(filters)}
        </Chip>

        {/* Driver chip */}
        {driverName && (
          <Chip bg="#dbeafe" color="#1d4ed8" onRemove={() => setFilters({ ...filters, driverId: "" })}>
            Driver: {driverName}
          </Chip>
        )}

        {/* Vehicle chip */}
        {vehicleLabel && (
          <Chip bg="#f3e8ff" color="#7c3aed" onRemove={() => setFilters({ ...filters, vehicleId: "" })}>
            Vehicle: {vehicleLabel}
          </Chip>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* Summary stat cards */}
      <div className="grid-3" style={{ marginBottom: "1.25rem" }}>
        <StatCard label="Total Deliveries" value={totals.deliveries} accent="var(--accent-primary)" />
        <StatCard label="Total Cans Delivered" value={totals.cans} accent="#0ea5e9" />
        <StatCard label="New Customers" value={totals.customers} accent="#8b5cf6" />
      </div>

      {loading ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Loading analytics...
        </div>
      ) : (
        <>
          <ChartCard title="Daily Deliveries">
            <LineChart data={deliveryChartData} color="var(--accent-primary)" gradientId="grad-deliveries" />
          </ChartCard>
          <ChartCard title="Cans Delivered per Day">
            <BarChart data={cansChartData} color="#0ea5e9" gradientId="grad-cans" />
          </ChartCard>
          <ChartCard title="New Customer Registrations">
            <BarChart data={registrationChartData} color="#8b5cf6" gradientId="grad-registrations" />
          </ChartCard>
        </>
      )}

      {modalOpen && (
        <FilterModal
          draft={draft}
          setDraft={setDraft}
          onApply={applyFilters}
          onClose={() => setModalOpen(false)}
          drivers={drivers}
          vehicles={vehicles}
        />
      )}
    </div>
  );
}
