"use client";

import { FormEvent, useState } from "react";
import { useAdminQueryClient, useAdminVehicles } from "../../hooks/useAdminQueries";

interface Vehicle {
  _id: string;
  name: string;
  vehicleNumber: string;
  capacity: string;
  isActive: boolean;
  createdAt: string;
}

export default function VehiclesPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", vehicleNumber: "", capacity: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    vehicleNumber: "",
    capacity: "",
    isActive: true,
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: vehicles, isLoading: isVehiclesLoading } = useAdminVehicles();
  const queryClient = useAdminQueryClient();

  function maskName(name: string) {
    return name.length > 12 ? `${name.slice(0, 12)}...` : name;
  }

  async function safeParseJson(response: Response) {
    try {
      return (await response.json()) as { error?: string };
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
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await safeParseJson(res);
      setSubmitting(false);
      if (!res.ok) {
        setFormError(data.error ?? "Failed to add vehicle.");
        return;
      }
      setFormSuccess("Vehicle added successfully.");
      setFormData({ name: "", vehicleNumber: "", capacity: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
      setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1200);
    } catch {
      setSubmitting(false);
      setFormError("Failed to add vehicle. Please try again.");
    }
  }

  async function toggleVehicle(vehicle: Vehicle): Promise<boolean> {
    setTogglingId(vehicle._id);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicle._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      });
      if (!res.ok) {
        const data = await safeParseJson(res);
        setFormError(data.error ?? "Failed to update vehicle status.");
        return false;
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
      return true;
    } catch {
      setFormError("Failed to update vehicle status. Please try again.");
      return false;
    } finally {
      setTogglingId(null);
    }
  }

  function openEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setEditError("");
    setEditData({
      name: vehicle.name,
      vehicleNumber: vehicle.vehicleNumber,
      capacity: vehicle.capacity,
      isActive: vehicle.isActive,
    });
  }

  async function saveEdit() {
    if (!editingVehicle) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/vehicles/${editingVehicle._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await safeParseJson(res);
      setEditSaving(false);
      if (!res.ok) {
        setEditError(data.error ?? "Failed to update vehicle.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
      setEditingVehicle(null);
    } catch {
      setEditSaving(false);
      setEditError("Failed to update vehicle. Please try again.");
    }
  }

  function openVehicleDetails(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
  }

  async function deleteVehicle(vehicle: Vehicle) {
    const shouldDelete = window.confirm(`Permanently delete vehicle "${vehicle.name}" (${vehicle.vehicleNumber})? This cannot be undone.`);
    if (!shouldDelete) return;
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicle._id}`, { method: "DELETE" });
      const data = await safeParseJson(res);
      if (!res.ok) {
        setFormError(data.error ?? "Failed to delete vehicle.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "vehicles"] });
      setSelectedVehicle(null);
      if (editingVehicle?._id === vehicle._id) setEditingVehicle(null);
    } catch {
      setFormError("Failed to delete vehicle. Please try again.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1>Vehicles</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Admin controls which vehicles drivers can use while logging supply.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm((prev) => !prev);
            setFormError("");
            setFormSuccess("");
          }}
        >
          {showForm ? "Cancel" : "Add Vehicle"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>New Vehicle</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-3" style={{ marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="vehicleName">
                  Number
                </label>
                <input
                  id="vehicleName"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. 1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vehicleNumber">
                  Model
                </label>
                <input
                  id="vehicleNumber"
                  className="form-input"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData((d) => ({ ...d, vehicleNumber: e.target.value }))}
                  placeholder="e.g. Tata Ace"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vehicleCapacity">
                  Capacity
                </label>
                <input
                  id="vehicleCapacity"
                  className="form-input"
                  value={formData.capacity}
                  onChange={(e) => setFormData((d) => ({ ...d, capacity: e.target.value }))}
                  placeholder="e.g. 1000L"
                  required
                />
              </div>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

            <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
              {submitting ? "Saving..." : "Create Vehicle"}
            </button>
          </form>
        </div>
      )}

      {isVehiclesLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading vehicles...</p>
      ) : !vehicles || vehicles.length === 0 ? (
        <div className="card empty-state">No vehicles added yet.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Number</th>
                <th>Model</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle, index) => (
                <tr key={vehicle._id}>
                  <td
                    role="button"
                    tabIndex={0}
                    onClick={() => openVehicleDetails(vehicle)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openVehicleDetails(vehicle);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {index + 1}
                  </td>
                  <td
                    role="button"
                    tabIndex={0}
                    onClick={() => openVehicleDetails(vehicle)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openVehicleDetails(vehicle);
                      }
                    }}
                    style={{ fontWeight: 600, cursor: "pointer" }}
                  >
                    {maskName(vehicle.name)}
                  </td>
                  <td
                    role="button"
                    tabIndex={0}
                    onClick={() => openVehicleDetails(vehicle)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openVehicleDetails(vehicle);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {vehicle.vehicleNumber}
                  </td>
                  <td
                    role="button"
                    tabIndex={0}
                    onClick={() => openVehicleDetails(vehicle)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openVehicleDetails(vehicle);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <span
                      title={vehicle.isActive ? "Active" : "Inactive"}
                      aria-label={vehicle.isActive ? "Active" : "Inactive"}
                      style={{
                        display: "inline-block",
                        width: "10px",
                        height: "10px",
                        borderRadius: "999px",
                        background: vehicle.isActive ? "#16a34a" : "#dc2626",
                        border: "1px solid rgba(0,0,0,0.12)",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedVehicle && (
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
          onClick={() => setSelectedVehicle(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Vehicle Details</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedVehicle(null)}>
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
              <div><strong>Number:</strong> {selectedVehicle.name}</div>
              <div><strong>Model:</strong> {selectedVehicle.vehicleNumber}</div>
              <div><strong>Capacity:</strong> {selectedVehicle.capacity}</div>
              <div>
                <strong>Status:</strong>{" "}
                <span
                  title={selectedVehicle.isActive ? "Active" : "Inactive"}
                  aria-label={selectedVehicle.isActive ? "Active" : "Inactive"}
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "999px",
                    background: selectedVehicle.isActive ? "#16a34a" : "#dc2626",
                    border: "1px solid rgba(0,0,0,0.12)",
                    verticalAlign: "middle",
                  }}
                />
              </div>
              <div><strong>Created:</strong> {new Date(selectedVehicle.createdAt).toLocaleDateString("en-IN")}</div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  openEdit(selectedVehicle);
                  setSelectedVehicle(null);
                }}
              >
                Edit Vehicle
              </button>
              <button
                type="button"
                className={`btn ${selectedVehicle.isActive ? "btn-danger" : "btn-success"}`}
                disabled={togglingId === selectedVehicle._id}
                onClick={async () => {
                  const ok = await toggleVehicle(selectedVehicle);
                  if (ok) setSelectedVehicle((prev) => prev ? { ...prev, isActive: !prev.isActive } : prev);
                }}
              >
                {togglingId === selectedVehicle._id ? "..." : selectedVehicle.isActive ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void deleteVehicle(selectedVehicle)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingVehicle && (
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
          onClick={() => setEditingVehicle(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Edit Vehicle</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingVehicle(null)}>
                Close
              </button>
            </div>

            <div className="grid-2" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="editVehicleName">Number</label>
                <input
                  id="editVehicleName"
                  className="form-input"
                  value={editData.name}
                  onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editVehicleNumber">Model</label>
                <input
                  id="editVehicleNumber"
                  className="form-input"
                  value={editData.vehicleNumber}
                  onChange={(e) => setEditData((d) => ({ ...d, vehicleNumber: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editVehicleCapacity">Capacity</label>
                <input
                  id="editVehicleCapacity"
                  className="form-input"
                  value={editData.capacity}
                  onChange={(e) => setEditData((d) => ({ ...d, capacity: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editVehicleStatus">Status</label>
                <select
                  id="editVehicleStatus"
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

            <button type="button" className="btn btn-primary" disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
