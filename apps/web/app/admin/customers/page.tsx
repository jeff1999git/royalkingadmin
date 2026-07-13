"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminPaginatedCustomers, type Customer } from "../../hooks/useAdminQueries";

const PAGE_LIMIT = 30;

function todayISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isoToDateInput(iso?: string | null): string {
  if (!iso) return todayISO();
  const d = new Date(iso);
  if (isNaN(d.getTime())) return todayISO();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const locationTypeLabel = (lt?: string) =>
  lt === "home" ? "Home" : lt === "office" ? "Office" : lt === "both" ? "Both" : undefined;

const PAGINATED_KEY = ["admin", "customers", "paginated"];

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterArea, setFilterArea] = useState("");

  // Debounce search by 400ms and reset to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 when area filter changes
  useEffect(() => { setPage(1); }, [filterArea]);

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminPaginatedCustomers({
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch,
    area: filterArea,
  });

  const customers = data?.customers ?? [];
  const active = customers.filter((c) => c.isActive);
  const inactive = customers.filter((c) => !c.isActive);
  const areas = data?.areas ?? [];
  const totalPages = data?.totalPages ?? 1;
  const activeCount = data?.activeCount ?? 0;
  const inactiveCount = data?.inactiveCount ?? 0;

  // ── Form state ───────────────────────────────────────────────────────────────
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
    securityDeposit: "",
    registeredDate: todayISO(),
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Edit state ───────────────────────────────────────────────────────────────
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
    securityDeposit: "",
    isActive: true,
    registeredDate: todayISO(),
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Other UI state ───────────────────────────────────────────────────────────
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [pageError, setPageError] = useState("");

  async function safeJson(res: Response) {
    try { return await res.json() as { error?: string }; } catch { return {}; }
  }

  function invalidateCustomers() {
    void queryClient.invalidateQueries({ queryKey: PAGINATED_KEY });
    // also invalidate the full-list used in dropdowns elsewhere
    void queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
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
          securityDeposit: formData.securityDeposit !== "" ? Number(formData.securityDeposit) : undefined,
          registeredDate: formData.registeredDate || undefined,
        }),
      });
      const d = await safeJson(res);
      setSubmitting(false);
      if (!res.ok) { setFormError(d.error ?? "Failed to create customer"); return; }
      setFormSuccess("Customer created!");
      setFormData({ name: "", phone: "", email: "", address: "", area: "", locationType: "home", subscriptionCans: "1", cashPerCan: "", securityDeposit: "", registeredDate: todayISO() });
      invalidateCustomers();
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
      securityDeposit: customer.securityDeposit !== undefined ? String(customer.securityDeposit) : "",
      isActive: customer.isActive,
      registeredDate: isoToDateInput(customer.registeredDate ?? customer.createdAt),
    });
    setEditError("");
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
          securityDeposit: editData.securityDeposit !== "" ? Number(editData.securityDeposit) : null,
          isActive: editData.isActive,
          registeredDate: editData.registeredDate || undefined,
        }),
      });
      setEditSaving(false);
      if (!res.ok) {
        const errData = await safeJson(res);
        setEditError(errData.error ?? "Failed to update customer");
        return;
      }
      invalidateCustomers();
      setEditingCustomer(null);
    } catch {
      setEditSaving(false);
      setEditError("Failed to update customer");
    }
  }

  async function doDeleteCustomer() {
    if (!confirmDeleteCustomer) return;
    const customer = confirmDeleteCustomer;
    setConfirmDeleteCustomer(null);
    setDeletingCustomer(true);
    setPageError("");
    try {
      const res = await fetch(`/api/admin/customers/${customer._id}`, { method: "DELETE" });
      setDeletingCustomer(false);
      if (!res.ok) { setPageError("Failed to delete customer."); return; }
      invalidateCustomers();
    } catch {
      setDeletingCustomer(false);
      setPageError("Failed to delete customer. Please try again.");
    }
  }

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

      {/* Search + Filter */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="searchCustomer">Search</label>
            <input
              id="searchCustomer"
              className="form-input"
              placeholder="Name, phone, email, area..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
        {(searchInput || filterArea) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: "0.5rem" }}
            onClick={() => { setSearchInput(""); setFilterArea(""); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Customer List */}
      {isLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading customers...</p>
      ) : customers.length === 0 ? (
        <div className="card empty-state">No customers found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {active.length > 0 && (
            <div>
              <h3 style={{ marginBottom: "0.6rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Active ({activeCount})
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
                      <tr
                        key={customer._id}
                        style={{ cursor: "pointer" }}
                        onClick={() => router.push(`/admin/customers/${customer._id}`)}
                      >
                        <td>
                          <span style={{ fontWeight: 600 }}>{customer.name}</span>
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
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(customer); }}>Edit</button>
                            <button type="button" className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); setConfirmDeleteCustomer(customer); }}>Delete</button>
                          </div>
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
                Inactive ({inactiveCount})
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
                      <tr
                        key={customer._id}
                        style={{ opacity: 0.6, cursor: "pointer" }}
                        onClick={() => router.push(`/admin/customers/${customer._id}`)}
                      >
                        <td>
                          <span style={{ fontWeight: 600 }}>{customer.name}</span>
                        </td>
                        <td>{customer.phone}</td>
                        <td>{locationTypeLabel(customer.locationType) ?? "-"}</td>
                        <td>{customer.area ?? "-"}</td>
                        <td>{customer.subscriptionCans}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(customer); }}>Edit</button>
                            <button type="button" className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); setConfirmDeleteCustomer(customer); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between" style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Page {page} of {totalPages} &nbsp;·&nbsp; {data?.total ?? 0} customers
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
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
                        <input type="radio" name="cLocationType" value={lt} checked={formData.locationType === lt} onChange={() => setFormData((f) => ({ ...f, locationType: lt }))} />
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
                <div className="form-group">
                  <label className="form-label" htmlFor="cCashPerCan">Cash Per Can (₹)</label>
                  <input id="cCashPerCan" className="form-input" type="number" min="0" step="0.01" value={formData.cashPerCan} onChange={(e) => setFormData((f) => ({ ...f, cashPerCan: e.target.value }))} placeholder="e.g. 50" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cSecurityDeposit">Security Deposit (₹)</label>
                  <input id="cSecurityDeposit" className="form-input" type="number" min="0" step="0.01" value={formData.securityDeposit} onChange={(e) => setFormData((f) => ({ ...f, securityDeposit: e.target.value }))} placeholder="e.g. 500" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cRegisteredDate">Added Date *</label>
                  <input id="cRegisteredDate" className="form-input" type="date" value={formData.registeredDate} onChange={(e) => setFormData((f) => ({ ...f, registeredDate: e.target.value }))} required />
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

      {/* Confirm Delete Modal */}
      {confirmDeleteCustomer && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 400 }}
          onClick={() => setConfirmDeleteCustomer(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "0.75rem" }}>Delete Customer?</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              <strong>{confirmDeleteCustomer.name}</strong> will be removed from your customer list.
            </p>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Their delivery history will stay preserved and can still be viewed in the deliveries section.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDeleteCustomer(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={deletingCustomer} onClick={() => void doDeleteCustomer()}>
                {deletingCustomer ? "Deleting..." : "Delete Customer"}
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
                      <input type="radio" name="eLocationType" value={lt} checked={editData.locationType === lt} onChange={() => setEditData((d) => ({ ...d, locationType: lt }))} />
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
              <div className="form-group">
                <label className="form-label" htmlFor="eSecurityDeposit">Security Deposit (₹)</label>
                <input id="eSecurityDeposit" className="form-input" type="number" min="0" step="0.01" value={editData.securityDeposit} onChange={(e) => setEditData((d) => ({ ...d, securityDeposit: e.target.value }))} placeholder="e.g. 500" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eRegisteredDate">Added Date</label>
                <input id="eRegisteredDate" className="form-input" type="date" value={editData.registeredDate} onChange={(e) => setEditData((d) => ({ ...d, registeredDate: e.target.value }))} />
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
