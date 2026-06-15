"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminPendingSupplies, useAdminQueryClient, useAdminVehicles } from "../../hooks/useAdminQueries";

interface SupplyLog {
  _id: string;
  suppliedAt: string;
  pointName: string;
  notes?: string;
  amount?: number;
  adminRemark?: string;
  driver?: {
    _id: string;
    name: string;
    username: string;
  };
  vehicle?: {
    _id: string;
    name: string;
    vehicleNumber: string;
    capacity: string;
  };
  formattedSuppliedAt?: string;
}

function toDateTimeLocalInput(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateHeading(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

export default function AmountsPage() {
  const GROUPS_PER_PAGE = 5;
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<SupplyLog | null>(null);
  const [modalPointName, setModalPointName] = useState("");
  const [modalSuppliedAt, setModalSuppliedAt] = useState("");
  const [modalVehicleId, setModalVehicleId] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalAmount, setModalAmount] = useState("");
  const [modalRemark, setModalRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useAdminQueryClient();
  const { data: logs, isLoading, isError } = useAdminPendingSupplies();
  const { data: vehicleOptions } = useAdminVehicles();

  const groupedLogs = useMemo(() => {
    if (!logs) return [];
    const serialById = new Map(logs.map((log, index) => [log._id, index + 1] as const));
    const groups = new Map<string, SupplyLog[]>();

    for (const log of logs) {
      const key = new Date(log.suppliedAt).toDateString();
      const current = groups.get(key) ?? [];
      current.push(log);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).map(([key, entries]) => ({
      key,
      label: getRelativeDayLabel(entries[0]?.suppliedAt ?? new Date()),
      entries: entries.map((entry) => ({
        ...entry,
        serialNo: serialById.get(entry._id) ?? 0,
      })),
    }));
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(groupedLogs.length / GROUPS_PER_PAGE));
  const pagedGroups = useMemo(() => {
    const start = (page - 1) * GROUPS_PER_PAGE;
    return groupedLogs.slice(start, start + GROUPS_PER_PAGE);
  }, [groupedLogs, page]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function openAddModal(log: SupplyLog) {
    setSelectedLog(log);
    setModalPointName(log.pointName ?? "");
    setModalSuppliedAt(toDateTimeLocalInput(log.suppliedAt));
    setModalVehicleId(log.vehicle?._id ?? "");
    setModalNotes(log.notes ?? "");
    setModalAmount("");
    setModalRemark("");
    setError("");
  }

  async function saveAmount() {
    if (!selectedLog) return;
    const amountText = modalAmount;
    if (!amountText || Number(amountText) < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/admin/supplies/${selectedLog._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pointName: modalPointName,
        suppliedAt: modalSuppliedAt,
        vehicleId: modalVehicleId,
        notes: modalNotes,
        amount: Number(amountText),
        adminRemark: modalRemark,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      setError("Failed to save amount.");
      return;
    }

    // Optimistically remove from the pending list cache so UI updates without a full refetch.
    queryClient.setQueryData<NonNullable<typeof logs>>(
      ["admin", "supplies", "pending"],
      (prev) => (prev ? prev.filter((log) => log._id !== selectedLog._id) : prev),
    );
    setSelectedLog(null);
    setModalAmount("");
    setModalRemark("");
  }

  async function deleteLog() {
    if (!selectedLog) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this supply log?"
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch(`/api/admin/supplies/${selectedLog._id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!res.ok) {
      setError("Failed to delete log.");
      return;
    }

    queryClient.setQueryData<NonNullable<typeof logs>>(
      ["admin", "supplies", "pending"],
      (prev) => (prev ? prev.filter((log) => log._id !== selectedLog._id) : prev),
    );
    setSelectedLog(null);
    setModalAmount("");
    setModalRemark("");
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h1>Add Amount</h1>
      </div>

      {(error || isError) && (
        <div className="alert alert-error">{error || "Failed to fetch pending supplies."}</div>
      )}

      {isLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading pending supplies...</p>
      ) : !logs || logs.length === 0 ? (
        <div className="card empty-state">All supplies already have amount added.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {pagedGroups.map((group) => (
            <div key={group.key}>
              <h3 style={{ marginBottom: "0.6rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                {group.label}
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>S.No</th>
                      <th>Point</th>
                      <th>Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((log) => (
                      <tr key={log._id}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => openAddModal(log)}
                          >
                            Add
                          </button>
                        </td>
                        <td>{log.serialNo}</td>
                        <td>{log.pointName}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{log.driver?.name}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between" style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </button>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedLog && (
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
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
              <h3>Add Amount</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>

            <div className="flex-col gap-2" style={{ marginBottom: "1rem" }}>
              <div>
                <div className="text-sm text-muted">Date & Time</div>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={modalSuppliedAt}
                  onChange={(e) => setModalSuppliedAt(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm text-muted">Driver</div>
                <div style={{ fontWeight: 600 }}>
                  {selectedLog.driver?.name} (@{selectedLog.driver?.username})
                </div>
              </div>
              <div>
                <div className="text-sm text-muted">Supply Point</div>
                <input
                  className="form-input"
                  value={modalPointName}
                  onChange={(e) => setModalPointName(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm text-muted">Vehicle</div>
                <select
                  className="form-select"
                  value={modalVehicleId}
                  onChange={(e) => setModalVehicleId(e.target.value)}
                >
                  <option value="">Select vehicle</option>
                  {(vehicleOptions ?? [])
                    .filter((vehicle) => vehicle.isActive)
                    .map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.name} - {vehicle.vehicleNumber} ({vehicle.capacity})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <div className="text-sm text-muted">Driver Notes</div>
                <input
                  className="form-input"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label className="form-label" htmlFor="modalAmount">Amount</label>
              <input
                id="modalAmount"
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                placeholder="e.g. 800"
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label" htmlFor="modalRemark">Admin Remark (Optional)</label>
              <input
                id="modalRemark"
                className="form-input"
                value={modalRemark}
                onChange={(e) => setModalRemark(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex items-center justify-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving || deleting}
                onClick={() => void deleteLog()}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || deleting}
                onClick={() => void saveAmount()}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
