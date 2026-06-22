"use client";

import { useState, FormEvent } from "react";
import { useAdminDrivers, useAdminQueryClient, useAdminVehicles } from "../../hooks/useAdminQueries";

interface Driver {
  _id: string;
  name: string;
  username: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  assignedVehicle?: {
    _id: string;
    name: string;
    vehicleNumber: string;
    capacity: string;
    isActive: boolean;
  } | null;
}

export default function DriversPage() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: "", username: "", password: "", phone: "", assignedVehicleId: "" });
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [editData, setEditData] = useState({
        name: "",
        username: "",
        phone: "",
        assignedVehicleId: "",
        isActive: true,
    });
    const [editError, setEditError] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const { data: drivers, isLoading: isDriversLoading } = useAdminDrivers();
    const { data: vehicles } = useAdminVehicles();
    const queryClient = useAdminQueryClient();

    function maskName(name: string) {
        return name.length > 12 ? `${name.slice(0, 12)}...` : name;
    }

    async function safeParseJson(response: Response) {
        try {
            return await response.json() as { error?: string };
        } catch {
            return {};
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");
        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/drivers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await safeParseJson(res);
            setSubmitting(false);

            if (!res.ok) {
                setFormError(data.error ?? "Failed to create driver");
                return;
            }
            setFormSuccess("Driver created successfully!");
            setFormData({ name: "", username: "", password: "", phone: "", assignedVehicleId: "" });
            await queryClient.invalidateQueries({ queryKey: ["admin", "drivers"] });
            setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1500);
        } catch {
            setSubmitting(false);
            setFormError("Failed to create driver");
        }
    }

    async function toggleActive(driver: Driver): Promise<boolean> {
        setTogglingId(driver._id);
        try {
            const res = await fetch(`/api/admin/drivers/${driver._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !driver.isActive }),
            });
            if (!res.ok) {
                const data = await safeParseJson(res);
                setFormError(data.error ?? "Failed to update driver status.");
                return false;
            }
            await queryClient.invalidateQueries({ queryKey: ["admin", "drivers"] });
            return true;
        } catch {
            setFormError("Failed to update driver status. Please try again.");
            return false;
        } finally {
            setTogglingId(null);
        }
    }

    function openEdit(driver: Driver) {
        setEditingDriver(driver);
        setEditError("");
        setEditData({
            name: driver.name,
            username: driver.username,
            phone: driver.phone ?? "",
            assignedVehicleId: driver.assignedVehicle?._id ?? "",
            isActive: driver.isActive,
        });
    }

    async function saveEdit() {
        if (!editingDriver) return;
        setEditSaving(true);
        setEditError("");
        try {
            const res = await fetch(`/api/admin/drivers/${editingDriver._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            const data = await safeParseJson(res);
            setEditSaving(false);
            if (!res.ok) {
                setEditError(data.error ?? "Failed to update driver");
                return;
            }
            await queryClient.invalidateQueries({ queryKey: ["admin", "drivers"] });
            setEditingDriver(null);
        } catch {
            setEditSaving(false);
            setEditError("Failed to update driver");
        }
    }

    function openDriverDetails(driver: Driver) {
        setSelectedDriver(driver);
    }

    async function deleteDriver(driver: Driver) {
        const shouldDelete = window.confirm(`Permanently delete driver "${driver.name}"? This cannot be undone.`);
        if (!shouldDelete) return;
        try {
            const res = await fetch(`/api/admin/drivers/${driver._id}`, { method: "DELETE" });
            const data = await safeParseJson(res);
            if (!res.ok) {
                setFormError(data.error ?? "Failed to delete driver");
                return;
            }
            await queryClient.invalidateQueries({ queryKey: ["admin", "drivers"] });
            setSelectedDriver(null);
            if (editingDriver?._id === driver._id) setEditingDriver(null);
        } catch {
            setFormError("Failed to delete driver. Please try again.");
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-2" style={{ marginBottom: "1.5rem" }}>
                <div>
                    <h1>Drivers</h1>
                    <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
                        Manage driver accounts and credentials
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormError(""); setFormSuccess(""); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    {showForm ? "Cancel" : "Add Driver"}
                </button>
            </div>

            {/* Add Driver Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid var(--border-active)" }}>
                    <h3 style={{ marginBottom: "1.25rem" }}>New Driver</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="name">Full Name</label>
                                <input id="name" className="form-input" placeholder="e.g. Raju Kumar" value={formData.name}
                                    onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone">Phone</label>
                                <input id="phone" className="form-input" placeholder="e.g. 9876543210" value={formData.phone}
                                    onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="driverUsername">Username</label>
                                <input id="driverUsername" className="form-input" placeholder="e.g. raju01" value={formData.username}
                                    onChange={e => setFormData(d => ({ ...d, username: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="driverPassword">Password</label>
                                <input id="driverPassword" type="password" className="form-input" placeholder="Set password" value={formData.password}
                                    onChange={e => setFormData(d => ({ ...d, password: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="assignedVehicleId">Default Vehicle (Optional)</label>
                                <select
                                    id="assignedVehicleId"
                                    className="form-select"
                                    value={formData.assignedVehicleId}
                                    onChange={e => setFormData(d => ({ ...d, assignedVehicleId: e.target.value }))}
                                >
                                    <option value="">No default vehicle</option>
                                    {(vehicles ?? [])
                                        .filter((vehicle) => vehicle.isActive)
                                        .map((vehicle) => (
                                            <option key={vehicle._id} value={vehicle._id}>
                                                {maskName(vehicle.name)} - {vehicle.vehicleNumber} ({vehicle.capacity})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}
                        {formSuccess && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{formSuccess}</div>}
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Creating…" : "Create Driver"}
                        </button>
                    </form>
                </div>
            )}

            {/* Table */}
            {isDriversLoading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading drivers…</p>
            ) : !drivers || drivers.length === 0 ? (
                <div className="card empty-state">
                    <p>No drivers yet. Add one to get started.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Name</th>
                                <th>Default Vehicle</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver, index) => (
                                <tr key={driver._id}>
                                    <td
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openDriverDetails(driver)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                openDriverDetails(driver);
                                            }
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {index + 1}
                                    </td>
                                    <td
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openDriverDetails(driver)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                openDriverDetails(driver);
                                            }
                                        }}
                                        style={{ fontWeight: 500, cursor: "pointer" }}
                                    >
                                        {maskName(driver.name)}
                                    </td>
                                    <td
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openDriverDetails(driver)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                openDriverDetails(driver);
                                            }
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {driver.assignedVehicle
                                            ? `${maskName(driver.assignedVehicle.name)} - ${driver.assignedVehicle.vehicleNumber}`
                                            : "-"}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => openDriverDetails(driver)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    openDriverDetails(driver);
                                                }
                                            }}
                                            className="btn"
                                            style={{ padding: 0, background: "transparent", border: "none", cursor: "pointer" }}
                                        >
                                            <span
                                                title={driver.isActive ? "Active" : "Inactive"}
                                                aria-label={driver.isActive ? "Active" : "Inactive"}
                                                style={{
                                                    display: "inline-block",
                                                    width: "10px",
                                                    height: "10px",
                                                    borderRadius: "999px",
                                                    background: driver.isActive ? "#16a34a" : "#dc2626",
                                                    border: "1px solid rgba(0,0,0,0.12)",
                                                }}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedDriver && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem",
                        zIndex: 240,
                    }}
                    onClick={() => setSelectedDriver(null)}
                >
                    <div
                        className="card"
                        style={{ width: "100%", maxWidth: "560px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
                            <h3>Driver Details</h3>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedDriver(null)}>
                                Close
                            </button>
                        </div>

                        <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
                            <div><strong>Name:</strong> {selectedDriver.name}</div>
                            <div><strong>Username:</strong> @{selectedDriver.username}</div>
                            <div><strong>Phone:</strong> {selectedDriver.phone ?? "-"}</div>
                            <div>
                                <strong>Default Vehicle:</strong>{" "}
                                {selectedDriver.assignedVehicle
                                    ? `${selectedDriver.assignedVehicle.name} - ${selectedDriver.assignedVehicle.vehicleNumber}`
                                    : "-"}
                            </div>
                            <div>
                                <strong>Status:</strong>{" "}
                                <span
                                    title={selectedDriver.isActive ? "Active" : "Inactive"}
                                    aria-label={selectedDriver.isActive ? "Active" : "Inactive"}
                                    style={{
                                        display: "inline-block",
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "999px",
                                        background: selectedDriver.isActive ? "#16a34a" : "#dc2626",
                                        border: "1px solid rgba(0,0,0,0.12)",
                                        verticalAlign: "middle",
                                    }}
                                />
                            </div>
                            <div><strong>Joined:</strong> {selectedDriver.createdAt ? new Date(selectedDriver.createdAt).toLocaleDateString("en-IN") : "-"}</div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    openEdit(selectedDriver);
                                    setSelectedDriver(null);
                                }}
                            >
                                Edit Driver
                            </button>
                            <button
                                type="button"
                                className={`btn ${selectedDriver.isActive ? "btn-danger" : "btn-success"}`}
                                disabled={togglingId === selectedDriver._id}
                                onClick={async () => {
                                    const ok = await toggleActive(selectedDriver);
                                    if (ok) setSelectedDriver((prev) => prev ? { ...prev, isActive: !prev.isActive } : prev);
                                }}
                            >
                                {togglingId === selectedDriver._id ? "..." : selectedDriver.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => void deleteDriver(selectedDriver)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingDriver && (
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
                    onClick={() => setEditingDriver(null)}
                >
                    <div
                        className="card"
                        style={{ width: "100%", maxWidth: "560px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
                            <h3>Edit Driver</h3>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingDriver(null)}>
                                Close
                            </button>
                        </div>
                        <div className="grid-2" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="editDriverName">Full Name</label>
                                <input
                                    id="editDriverName"
                                    className="form-input"
                                    value={editData.name}
                                    onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="editDriverPhone">Phone</label>
                                <input
                                    id="editDriverPhone"
                                    className="form-input"
                                    value={editData.phone}
                                    onChange={(e) => setEditData((d) => ({ ...d, phone: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="editDriverUsername">Username</label>
                                <input
                                    id="editDriverUsername"
                                    className="form-input"
                                    value={editData.username}
                                    onChange={(e) => setEditData((d) => ({ ...d, username: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="editDriverVehicle">Default Vehicle</label>
                                <select
                                    id="editDriverVehicle"
                                    className="form-select"
                                    value={editData.assignedVehicleId}
                                    onChange={(e) => setEditData((d) => ({ ...d, assignedVehicleId: e.target.value }))}
                                >
                                    <option value="">No default vehicle</option>
                                    {(vehicles ?? [])
                                        .filter((vehicle) => vehicle.isActive)
                                        .map((vehicle) => (
                                            <option key={vehicle._id} value={vehicle._id}>
                                                {maskName(vehicle.name)} - {vehicle.vehicleNumber} ({vehicle.capacity})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: "1rem" }}>
                            <label className="form-label" htmlFor="editDriverActive">Status</label>
                            <select
                                id="editDriverActive"
                                className="form-select"
                                value={editData.isActive ? "active" : "inactive"}
                                onChange={(e) => setEditData((d) => ({ ...d, isActive: e.target.value === "active" }))}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        {editError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{editError}</div>}
                        <button type="button" className="btn btn-primary" disabled={editSaving} onClick={() => void saveEdit()}>
                            {editSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
