"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatNumber } from "../../../../lib/format";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

interface OdometerEntry {
  reading: number;
  recordedAt: string;
}

interface VehicleDetail {
  _id: string;
  name: string;
  vehicleNumber: string;
  capacity: string;
  isActive: boolean;
  odometer?: number;
  odometerLastUpdated?: string;
  odometerHistory?: OdometerEntry[];
  createdAt: string;
}

// Every point gets a date label up to 8 entries, then every 2nd, then about 8 in all.
function labelIntervalFor(n: number) {
  return n <= 8 ? 1 : n <= 16 ? 2 : Math.ceil(n / 8);
}

// `sorted` is the odometer history oldest first; the page sorts it once.
function OdometerLineChart({ sorted }: { sorted: OdometerEntry[] }) {
  if (sorted.length < 2) {
    return (
      <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
        Need at least 2 entries to show trend.
      </p>
    );
  }

  const W = 680, H = 220;
  const PAD = { top: 28, bottom: 44, left: 64, right: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minKm = Math.min(...sorted.map((e) => e.reading));
  const maxKm = Math.max(...sorted.map((e) => e.reading));
  const kmRange = maxKm - minKm || 1;
  const minTime = new Date(sorted[0]!.recordedAt).getTime();
  const maxTime = new Date(sorted[sorted.length - 1]!.recordedAt).getTime();
  const timeRange = maxTime - minTime || 1;

  function xOf(date: string) {
    return PAD.left + ((new Date(date).getTime() - minTime) / timeRange) * chartW;
  }
  function yOf(reading: number) {
    return PAD.top + chartH - ((reading - minKm) / kmRange) * chartH;
  }

  const points = sorted.map((e) => ({ x: xOf(e.recordedAt), y: yOf(e.reading), reading: e.reading, date: e.recordedAt }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]!.x},${PAD.top + chartH} L${points[0]!.x},${PAD.top + chartH} Z`;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round(minKm + (kmRange / yTicks) * i));
  const labelInterval = labelIntervalFor(points.length);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y-axis grid + labels */}
      {yTickValues.map((v) => {
        const y = yOf(v);
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border)" strokeWidth="0.8" strokeDasharray="4,3" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {formatNumber(v)}
            </text>
          </g>
        );
      })}

      {/* Baseline */}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="var(--border)" strokeWidth="1.2" />

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGradient)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots, each with at most one date label; the reading is the dot's tooltip */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--accent-primary)" stroke="#fff" strokeWidth="1.5">
            <title>{`${formatNumber(p.reading)} km`}</title>
          </circle>
          {(i % labelInterval === 0 || i === points.length - 1) && (
            <text x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
              {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// `sorted` is the odometer history oldest first; the page sorts it once.
function OdometerChart({ sorted }: { sorted: OdometerEntry[] }) {
  const deltas = sorted.slice(1).map((entry, i) => ({
    date: entry.recordedAt,
    km: Math.max(0, entry.reading - (sorted[i]?.reading ?? 0)),
  }));

  if (deltas.length === 0) {
    return (
      <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
        Need at least 2 entries to show chart.
      </p>
    );
  }

  const W = 540, H = 180;
  const PAD = { top: 24, bottom: 40, left: 48, right: 16 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxKm = Math.max(...deltas.map((d) => d.km), 1);
  const barW = Math.max(12, Math.min(40, chartW / deltas.length - 8));
  const step = chartW / deltas.length;
  const ticks = [0, Math.round(maxKm / 2), maxKm];
  const labelInterval = labelIntervalFor(deltas.length);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
    >
      {ticks.map((v) => {
        const y = PAD.top + chartH - (v / maxKm) * chartH;
        return (
          <g key={v}>
            <line
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="var(--border)" strokeWidth="0.8" strokeDasharray="4,3"
            />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {v}
            </text>
          </g>
        );
      })}
      <line
        x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH}
        stroke="var(--border)" strokeWidth="1.2"
      />
      {deltas.map((d, i) => {
        const barH = Math.max(3, (d.km / maxKm) * chartH);
        const cx = PAD.left + step * i + step / 2;
        const x = cx - barW / 2;
        const y = PAD.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="var(--accent-primary)" rx={4} opacity={0.82} />
            {d.km > 0 && (
              <text x={cx} y={y - 5} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontWeight="700">
                {d.km}
              </text>
            )}
            {(i % labelInterval === 0 || i === deltas.length - 1) && (
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="8.5" fill="var(--text-muted)">
                {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ name: "", vehicleNumber: "", capacity: "", isActive: true });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const closeEdit = useCallback(() => setEditOpen(false), []);
  useEscapeKey(closeEdit, editOpen);

  // Action states
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  // Only the first load blanks the page; refreshes after an edit or toggle
  // keep the current vehicle on screen.
  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/admin/vehicles/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? "Failed to load vehicle.");
        return;
      }
      const data = (await res.json()) as VehicleDetail;
      setVehicle(data);
    } catch {
      setError("Failed to load vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  // The vehicles list and the drivers list (assigned vehicle) cache for ten
  // minutes; tell them about the change.
  function invalidateLists() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "drivers"] });
  }

  // Sorted once per load: oldest first for the charts, newest first for the list.
  const odometerHistory = vehicle?.odometerHistory;
  const { history, newestFirst } = useMemo(() => {
    const asc = [...(odometerHistory ?? [])].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    return { history: asc, newestFirst: [...asc].reverse() };
  }, [odometerHistory]);

  function openEdit() {
    if (!vehicle) return;
    setEditData({
      name: vehicle.name,
      vehicleNumber: vehicle.vehicleNumber,
      capacity: vehicle.capacity,
      isActive: vehicle.isActive,
    });
    setEditError("");
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!vehicle) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicle._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) {
        setEditError(d.error ?? "Failed to update vehicle.");
        return;
      }
      setEditOpen(false);
      invalidateLists();
      void load();
    } catch {
      setEditError("Failed to update vehicle. Please try again.");
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleStatus() {
    if (!vehicle) return;
    setToggling(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicle._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setActionError(d.error ?? "Failed to update status.");
        return;
      }
      invalidateLists();
      void load();
    } catch {
      setActionError("Failed to update status. Please try again.");
    } finally {
      setToggling(false);
    }
  }

  async function deleteVehicle() {
    if (!vehicle) return;
    const ok = window.confirm(`Permanently delete vehicle "${vehicle.name}" (${vehicle.vehicleNumber})? This cannot be undone.`);
    if (!ok) return;
    setDeleting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicle._id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setActionError(d.error ?? "Failed to delete vehicle.");
        setDeleting(false);
        return;
      }
      invalidateLists();
      router.push("/admin/vehicles");
    } catch {
      setActionError("Failed to delete vehicle. Please try again.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Link href="/admin/vehicles" style={{ fontSize: "0.875rem", color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
          ← Back to Vehicles
        </Link>
        <p style={{ color: "var(--text-muted)", marginTop: "2rem" }}>Loading...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div>
        <Link href="/admin/vehicles" style={{ fontSize: "0.875rem", color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
          ← Back to Vehicles
        </Link>
        <div className="alert alert-error" style={{ marginTop: "1.5rem" }}>{error || "Vehicle not found."}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/admin/vehicles"
          style={{ fontSize: "0.875rem", color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem" }}
        >
          ← Back to Vehicles
        </Link>
        <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ margin: 0 }}>{vehicle.name}</h1>
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px",
              background: vehicle.isActive ? "#dcfce7" : "#fee2e2",
              color: vehicle.isActive ? "#15803d" : "#dc2626",
            }}>
              {vehicle.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={openEdit}>Edit</button>
            <button
              className={`btn ${vehicle.isActive ? "btn-danger" : "btn-success"}`}
              disabled={toggling}
              onClick={() => void toggleStatus()}
            >
              {toggling ? "..." : vehicle.isActive ? "Disable" : "Enable"}
            </button>
            <button className="btn btn-danger" disabled={deleting} onClick={() => void deleteVehicle()}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
        {actionError && <div className="alert alert-error" style={{ marginTop: "0.75rem" }}>{actionError}</div>}
      </div>

      {/* Two-column layout: info + odometer */}
      <div className="vehicle-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.25rem", alignItems: "start" }}>

        {/* Vehicle info card */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Vehicle Info
          </div>
          <div style={{ display: "grid", gap: "0.8rem" }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.15rem" }}>Number</div>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>{vehicle.name}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.15rem" }}>Model</div>
              <div style={{ fontWeight: 600 }}>{vehicle.vehicleNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.15rem" }}>Capacity</div>
              <div style={{ fontWeight: 600 }}>{vehicle.capacity}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.15rem" }}>Added On</div>
              <div style={{ fontWeight: 600 }}>{new Date(vehicle.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
          </div>
        </div>

        {/* Odometer card */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Odometer
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "0.75rem 1.1rem", minWidth: "120px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>Current Reading</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
                {formatNumber(vehicle.odometer ?? 0)}
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginLeft: "0.25rem" }}>km</span>
              </div>
            </div>
            {vehicle.odometerLastUpdated && (
              <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "0.75rem 1.1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>Last Updated</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                  {new Date(vehicle.odometerLastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            )}
            <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "0.75rem 1.1rem" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>Total Entries</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                {history.length}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          {history.length >= 2 ? (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.5rem" }}>
                Daily KMs Driven
              </div>
              <OdometerChart sorted={history} />
            </div>
          ) : (
            <div style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
              No chart yet — needs at least 2 days of readings.
            </div>
          )}

          {/* History list */}
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.5rem" }}>
            Odometer History ({history.length} {history.length === 1 ? "entry" : "entries"})
          </div>
          {newestFirst.length === 0 ? (
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No readings recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "280px", overflowY: "auto" }}>
              {newestFirst.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0.5rem 0.85rem",
                    background: i === 0 ? "#f0fdf4" : "var(--bg-secondary)",
                    border: `1px solid ${i === 0 ? "#bbf7d0" : "transparent"}`,
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {formatNumber(entry.reading)} km
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {i === 0 && (
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 700, background: "#dcfce7", color: "#15803d",
                        padding: "0.1rem 0.5rem", borderRadius: "99px",
                      }}>
                        Latest
                      </span>
                    )}
                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {new Date(entry.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Odometer trend — full width */}
      {history.length >= 2 && (
        <div className="card" style={{ marginTop: "1.25rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Odometer Trend — Days vs KMs
          </div>
          <OdometerLineChart sorted={history} />
        </div>
      )}

      {/* Responsive: stack on small screens */}
      <style>{`
        @media (max-width: 700px) {
          .vehicle-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Edit modal */}
      {editOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 250 }}
          onClick={() => setEditOpen(false)}
        >
          <div className="card" role="dialog" aria-modal="true" aria-labelledby="edit-vehicle-title" style={{ width: "100%", maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3 id="edit-vehicle-title">Edit Vehicle</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setEditOpen(false)}>Close</button>
            </div>
            <div className="grid-2" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="editName">Number</label>
                <input
                  id="editName"
                  className="form-input"
                  value={editData.name}
                  onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editModel">Model</label>
                <input
                  id="editModel"
                  className="form-input"
                  value={editData.vehicleNumber}
                  onChange={(e) => setEditData((d) => ({ ...d, vehicleNumber: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editCapacity">Capacity</label>
                <input
                  id="editCapacity"
                  className="form-input"
                  value={editData.capacity}
                  onChange={(e) => setEditData((d) => ({ ...d, capacity: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editStatus">Status</label>
                <select
                  id="editStatus"
                  className="form-select"
                  value={editData.isActive ? "active" : "inactive"}
                  onChange={(e) => setEditData((d) => ({ ...d, isActive: e.target.value === "active" }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {editError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{editError}</div>}
            <button className="btn btn-primary" disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
