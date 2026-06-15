"use client";

import { useEffect, useState, FormEvent } from "react";

interface Driver { _id: string; name: string; username: string; }
interface SupplyPoint { _id: string; name: string; address: string; tankerTypes: string[]; }
interface Assignment {
    _id: string;
    supplyPoint: { name: string; address: string; tankerTypes: string[] };
    driver: { name: string; username: string };
    tankerType: string;
    frequency: "once" | "daily";
    scheduledDate: string;
    status: "pending" | "completed";
    completedAt?: string;
    remark?: string;
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

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [supplyPoints, setSupplyPoints] = useState<SupplyPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ driver: "", supplyPoint: "", tankerType: "", scheduledDate: "", frequency: "once" });
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

    async function fetchAll() {
        const [aRes, dRes, spRes] = await Promise.all([
            fetch("/api/admin/assignments"),
            fetch("/api/admin/drivers"),
            fetch("/api/admin/supply-points"),
        ]);
        setAssignments(await aRes.json() as Assignment[]);
        setDrivers(await dRes.json() as Driver[]);
        setSupplyPoints(await spRes.json() as SupplyPoint[]);
        setLoading(false);
    }

    useEffect(() => { void fetchAll(); }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");
        setSubmitting(true);

        const res = await fetch("/api/admin/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        const data = await res.json() as { error?: string };
        setSubmitting(false);

        if (!res.ok) {
            setFormError(data.error ?? "Failed to create assignment");
            return;
        }
        setFormSuccess("Assignment created!");
        setFormData({ driver: "", supplyPoint: "", tankerType: "", scheduledDate: "", frequency: "once" });
        void fetchAll();
        setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1500);
    }

    const filtered = statusFilter === "all"
        ? assignments
        : assignments.filter(a => a.status === statusFilter);

    return (
        <div>
            <div className="flex items-center justify-between" style={{ marginBottom: "1.5rem" }}>
                <div>
                    <h1>Assignments</h1>
                    <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
                        Assign water supply points to drivers
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormError(""); setFormSuccess(""); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    {showForm ? "Cancel" : "New"}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid var(--border-active)" }}>
                    <h3 style={{ marginBottom: "1.25rem" }}>Create Assignment</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid-3" style={{ gap: "1rem", marginBottom: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="assignDriver">Driver</label>
                                <select id="assignDriver" className="form-select" value={formData.driver}
                                    onChange={e => setFormData(d => ({ ...d, driver: e.target.value }))} required>
                                    <option value="">Select driver…</option>
                                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} (@{d.username})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="assignSP">Supply Point</label>
                                <select id="assignSP" className="form-select" value={formData.supplyPoint}
                                    onChange={e => setFormData(d => ({ ...d, supplyPoint: e.target.value, tankerType: "" }))} required>
                                    <option value="">Select supply point…</option>
                                    {supplyPoints.map(sp => <option key={sp._id} value={sp._id}>{sp.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="assignDate">Scheduled Date</label>
                                <input id="assignDate" type="date" className="form-input" value={formData.scheduledDate}
                                    onChange={e => setFormData(d => ({ ...d, scheduledDate: e.target.value }))} required />
                            </div>
                            {formData.supplyPoint && (
                                <div className="grid-2" style={{ gridColumn: "1 / -1", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="assignTanker">Specific Tanker Type</label>
                                        <select id="assignTanker" className="form-select" value={formData.tankerType}
                                            onChange={e => setFormData(d => ({ ...d, tankerType: e.target.value }))} required>
                                            <option value="">Select a tanker type…</option>
                                            {supplyPoints.find(sp => sp._id === formData.supplyPoint)?.tankerTypes?.map(tt => (
                                                <option key={tt} value={tt}>{tt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="assignFrequency">Trip Frequency</label>
                                        <select id="assignFrequency" className="form-select" value={formData.frequency}
                                            onChange={e => setFormData(d => ({ ...d, frequency: e.target.value }))} required>
                                            <option value="once">One-Time Trip</option>
                                            <option value="daily">Daily Recurring Trip</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}
                        {formSuccess && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{formSuccess}</div>}
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Assigning…" : "Assign Supply"}
                        </button>
                    </form>
                </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {(["all", "pending", "completed"] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                        className={`btn btn-sm ${statusFilter === f ? "btn-primary" : "btn-secondary"}`}
                        style={{ textTransform: "capitalize" }}>
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading assignments…</p>
            ) : filtered.length === 0 ? (
                <div className="card empty-state"><p>No assignments found.</p></div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Supply Point</th>
                                <th>Driver</th>
                                <th>Tanker</th>
                                <th>Scheduled</th>
                                <th>Status</th>
                                <th>Completed At</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a._id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{a.supplyPoint.name}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.supplyPoint.address}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{a.driver.name}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>@{a.driver.username}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{a.tankerType}</td>
                                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            {new Date(a.scheduledDate).toLocaleDateString("en-IN")}
                                            {a.frequency === "daily" && (
                                                <span className="badge badge-warning" style={{ fontSize: "0.7rem", padding: "0.2rem 0.4rem" }}>
                                                    🔄 Daily
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${a.status === "completed" ? "badge-success" : "badge-warning"}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                        {a.completedAt ? formatDateTime(a.completedAt) : "—"}
                                    </td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "160px" }}>
                                        {a.remark ?? "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
