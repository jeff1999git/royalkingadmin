"use client";

import { useState, FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  area?: string;
  locationType?: "home" | "office" | "both";
  subscriptionCans: number;
  cashPerCan?: number;
  isActive: boolean;
  createdAt: string;
}

const CUSTOMERS_KEY = ["admin", "customers"];

function useAdminCustomers() {
  return useQuery<Customer[]>({
    queryKey: CUSTOMERS_KEY,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as Customer[]) : [];
    },
  });
}

const locationTypeLabel = (lt?: string) =>
  lt === "home" ? "Home" : lt === "office" ? "Office" : lt === "both" ? "Both" : undefined;

export default function CustomersPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    area: "",
    locationType: "home" as "home" | "office" | "both",
    subscriptionCans: "1",
    cashPerCan: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    area: "",
    locationType: "" as "home" | "office" | "both" | "",
    subscriptionCans: "1",
    cashPerCan: "",
    isActive: true,
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pageError, setPageError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterArea, setFilterArea] = useState("");

  const { data: customers, isLoading } = useAdminCustomers();
  const queryClient = useQueryClient();

  async function safeJson(res: Response) {
    try { return await res.json() as { error?: string }; } catch { return {}; }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
          area: formData.area || undefined,
          locationType: formData.locationType,
          subscriptionCans: Number(formData.subscriptionCans),
          cashPerCan: formData.cashPerCan !== "" ? Number(formData.cashPerCan) : undefined,
        }),
      });
      const data = await safeJson(res);
      setSubmitting(false);
      if (!res.ok) { setFormError(data.error ?? "Failed to create customer"); return; }
      setFormSuccess("Customer created!");
      setFormData({ name: "", phone: "", email: "", address: "", area: "", locationType: "home", subscriptionCans: "1", cashPerCan: "" });
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1500);
    } catch {
      setSubmitting(false);
      setFormError("Failed to create customer");
    }
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setEditData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      address: customer.address ?? "",
      area: customer.area ?? "",
      locationType: customer.locationType ?? "",
      subscriptionCans: String(customer.subscriptionCans),
      cashPerCan: customer.cashPerCan !== undefined ? String(customer.cashPerCan) : "",
      isActive: customer.isActive,
    });
    setEditError("");
    setSelectedCustomer(null);
  }

  async function saveEdit() {
    if (!editingCustomer) return;
    setEditError("");
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          phone: editData.phone,
          email: editData.email || undefined,
          address: editData.address,
          area: editData.area || undefined,
          locationType: editData.locationType || undefined,
          subscriptionCans: Number(editData.subscriptionCans),
          cashPerCan: editData.cashPerCan !== "" ? Number(editData.cashPerCan) : null,
          isActive: editData.isActive,
        }),
      });
      const data = await safeJson(res);
      setEditSaving(false);
      if (!res.ok) { setEditError(data.error ?? "Failed to update customer"); return; }
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      setEditingCustomer(null);
    } catch {
      setEditSaving(false);
      setEditError("Failed to update customer");
    }
  }

  async function deleteCustomer(customer: Customer) {
    const confirmed = window.confirm(`Delete customer "${customer.name}"? This cannot be undone.`);
    if (!confirmed) return;
    setPageError("");
    const res = await fetch(`/api/admin/customers/${customer._id}`, { method: "DELETE" });
    if (!res.ok) { setPageError("Failed to delete customer."); return; }
    setSelectedCustomer(null);
    await queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
  }

  const areas = Array.from(new Set((customers ?? []).map((c) => c.area).filter(Boolean) as string[])).sort();

  const filtered = (customers ?? []).filter((c) => {
    const matchSearch =
      !searchText ||
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.phone.includes(searchText) ||
      (c.email ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (c.area ?? "").toLowerCase().includes(searchText.toLowerCase());
    const matchArea = !filterArea || c.area === filterArea;
    return matchSearch && matchArea;
  });

  const active = filtered.filter((c) => c.isActive);
  const inactive = filtered.filter((c) => !c.isActive);

  return (
    <div>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <h1>Customers</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setFormError(""); setFormSuccess(""); }}
        >
          + Add Customer
        </button>
      </div>

      {pageError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{pageError}</div>}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="searchCustomer">Search</label>
            <input
              id="searchCustomer"
              className="form-input"
              placeholder="Name, phone, email, area..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="filterArea">Area</label>
            <select
              id="filterArea"
              className="form-select"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="">All Areas</option>
              {areas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
        {(searchText || filterArea) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: "0.5rem" }}
            onClick={() => { setSearchText(""); setFilterArea(""); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading customers...</p>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">No customers found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {active.length > 0 && (
            <div>
              <h3 style={{ marginBottom: "0.6rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Active ({active.length})
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Area</th>
                      <th>Cans/Day</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.map((customer) => (
                      <tr key={customer._id}>
                        <td>
                          <button
                            type="button"
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600, textAlign: "left" }}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            {customer.name}
                          </button>
                          {customer.address && (
                            <div className="text-sm text-muted">{customer.address}</div>
                          )}
                        </td>
                        <td>{customer.phone}</td>
                        <td>
                          {customer.locationType ? (
                            <span style={{
                              fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                              borderRadius: "20px",
                              background: customer.locationType === "home" ? "#e8f5e9" : customer.locationType === "office" ? "#e3f2fd" : "#f3e8ff",
                              color: customer.locationType === "home" ? "#2e7d32" : customer.locationType === "office" ? "#1565c0" : "#7e22ce",
                            }}>
                              {locationTypeLabel(customer.locationType)}
                            </span>
                          ) : "-"}
                        </td>
                        <td>{customer.area ?? "-"}</td>
                        <td style={{ fontWeight: 700 }}>{customer.subscriptionCans}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEdit(customer)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <h3 style={{ marginBottom: "0.6rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Inactive ({inactive.length})
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Area</th>
                      <th>Cans/Day</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactive.map((customer) => (
                      <tr key={customer._id} style={{ opacity: 0.6 }}>
                        <td>
                          <button
                            type="button"
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600, textAlign: "left" }}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            {customer.name}
                          </button>
                        </td>
                        <td>{customer.phone}</td>
                        <td>{locationTypeLabel(customer.locationType) ?? "-"}</td>
                        <td>{customer.area ?? "-"}</td>
                        <td>{customer.subscriptionCans}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEdit(customer)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 250 }}
          onClick={() => setShowForm(false)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Add Customer</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowForm(false)}>Close</button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="grid-2" style={{ marginBottom: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cName">Name *</label>
                  <input id="cName" className="form-input" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} placeholder="Customer name" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cPhone">Phone *</label>
                  <input id="cPhone" className="form-input" value={formData.phone} onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))} placeholder="Unique phone number" required />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="cEmail">Gmail / Email (Optional)</label>
                  <input id="cEmail" className="form-input" type="email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} placeholder="customer@gmail.com" />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Type *</label>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.4rem" }}>
                    {(["home", "office", "both"] as const).map((lt) => (
                      <label key={lt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: formData.locationType === lt ? 700 : 500 }}>
                        <input
                          type="radio"
                          name="cLocationType"
                          value={lt}
                          checked={formData.locationType === lt}
                          onChange={() => setFormData((f) => ({ ...f, locationType: lt }))}
                        />
                        {lt === "home" ? "Home" : lt === "office" ? "Office" : "Both"}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="cAddress">Location *</label>
                  <input id="cAddress" className="form-input" value={formData.address} onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))} placeholder="Full address or landmark" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cArea">Area</label>
                  <input id="cArea" className="form-input" value={formData.area} onChange={(e) => setFormData((f) => ({ ...f, area: e.target.value }))} placeholder="e.g. Sector 4" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cCans">Subscription Cans/Day *</label>
                  <input id="cCans" className="form-input" type="number" min="1" step="1" value={formData.subscriptionCans} onChange={(e) => setFormData((f) => ({ ...f, subscriptionCans: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="cCashPerCan">Cash Per Can (₹)</label>
                  <input id="cCashPerCan" className="form-input" type="number" min="0" step="0.01" value={formData.cashPerCan} onChange={(e) => setFormData((f) => ({ ...f, cashPerCan: e.target.value }))} placeholder="e.g. 50" />
                </div>
              </div>
              {formError && <div className="alert alert-error">{formError}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
              <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                {submitting ? "Saving..." : "Add Customer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedCustomer && !editingCustomer && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 250 }}
          onClick={() => setSelectedCustomer(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Customer Details</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
            <div className="flex-col gap-2">
              <div>
                <div className="text-sm text-muted">Name</div>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted">Phone</div>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.phone}</div>
              </div>
              {selectedCustomer.email && (
                <div>
                  <div className="text-sm text-muted">Email</div>
                  <div style={{ fontWeight: 500 }}>{selectedCustomer.email}</div>
                </div>
              )}
              {selectedCustomer.locationType && (
                <div>
                  <div className="text-sm text-muted">Type</div>
                  <div style={{ fontWeight: 600 }}>{locationTypeLabel(selectedCustomer.locationType)}</div>
                </div>
              )}
              {selectedCustomer.address && (
                <div>
                  <div className="text-sm text-muted">Location</div>
                  <div style={{ fontWeight: 500 }}>{selectedCustomer.address}</div>
                </div>
              )}
              {selectedCustomer.area && (
                <div>
                  <div className="text-sm text-muted">Area</div>
                  <div style={{ fontWeight: 600 }}>{selectedCustomer.area}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted">Subscription</div>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.subscriptionCans} can{selectedCustomer.subscriptionCans !== 1 ? "s" : ""}/day</div>
              </div>
              {selectedCustomer.cashPerCan !== undefined && (
                <div>
                  <div className="text-sm text-muted">Cash Per Can</div>
                  <div style={{ fontWeight: 600 }}>₹{selectedCustomer.cashPerCan}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted">Status</div>
                <div style={{ fontWeight: 600, color: selectedCustomer.isActive ? "var(--accent-primary)" : "var(--text-muted)" }}>
                  {selectedCustomer.isActive ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: "1.25rem", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void deleteCustomer(selectedCustomer)}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openEdit(selectedCustomer)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 260 }}
          onClick={() => setEditingCustomer(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Edit Customer</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingCustomer(null)}>Close</button>
            </div>
            <div className="grid-2" style={{ marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="eName">Name</label>
                <input id="eName" className="form-input" value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ePhone">Phone</label>
                <input id="ePhone" className="form-input" value={editData.phone} onChange={(e) => setEditData((d) => ({ ...d, phone: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="eEmail">Gmail / Email</label>
                <input id="eEmail" className="form-input" type="email" value={editData.email} onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Type</label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.4rem" }}>
                  {(["home", "office", "both"] as const).map((lt) => (
                    <label key={lt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: editData.locationType === lt ? 700 : 500 }}>
                      <input
                        type="radio"
                        name="eLocationType"
                        value={lt}
                        checked={editData.locationType === lt}
                        onChange={() => setEditData((d) => ({ ...d, locationType: lt }))}
                      />
                      {lt === "home" ? "Home" : lt === "office" ? "Office" : "Both"}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="eAddress">Location *</label>
                <input id="eAddress" className="form-input" value={editData.address} onChange={(e) => setEditData((d) => ({ ...d, address: e.target.value }))} placeholder="Full address or landmark" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eArea">Area</label>
                <input id="eArea" className="form-input" value={editData.area} onChange={(e) => setEditData((d) => ({ ...d, area: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eCans">Cans/Day</label>
                <input id="eCans" className="form-input" type="number" min="1" step="1" value={editData.subscriptionCans} onChange={(e) => setEditData((d) => ({ ...d, subscriptionCans: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eCashPerCan">Cash Per Can (₹)</label>
                <input id="eCashPerCan" className="form-input" type="number" min="0" step="0.01" value={editData.cashPerCan} onChange={(e) => setEditData((d) => ({ ...d, cashPerCan: e.target.value }))} placeholder="e.g. 50" />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="eStatus">Status</label>
                <select id="eStatus" className="form-select" value={editData.isActive ? "active" : "inactive"} onChange={(e) => setEditData((d) => ({ ...d, isActive: e.target.value === "active" }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {editError && <div className="alert alert-error">{editError}</div>}
            <button type="button" className="btn btn-primary mt-2" disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
