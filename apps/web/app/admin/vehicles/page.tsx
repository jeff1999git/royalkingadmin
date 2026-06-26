"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminQueryClient, useAdminVehicles } from "../../hooks/useAdminQueries";

export default function VehiclesPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", vehicleNumber: "", capacity: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

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
                <label className="form-label" htmlFor="vehicleName">Number</label>
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
                <label className="form-label" htmlFor="vehicleNumber">Model</label>
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
                <label className="form-label" htmlFor="vehicleCapacity">Capacity</label>
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
                <tr
                  key={vehicle._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/admin/vehicles/${vehicle._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/admin/vehicles/${vehicle._id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>{maskName(vehicle.name)}</td>
                  <td>{vehicle.vehicleNumber}</td>
                  <td>
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
    </div>
  );
}
