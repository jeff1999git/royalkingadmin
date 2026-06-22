"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminPaginatedSupplies, useAdminTodayStats } from "../hooks/useAdminQueries";

function todayInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

const LOGS_PAGE_LIMIT = 10;

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

export default function AdminDashboard() {
  const [logsPage, setLogsPage] = useState(1);
  const today = todayInputValue();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useAdminTodayStats(today);

  const {
    data: logsData,
    isLoading: logsLoading,
    isError: logsError,
  } = useAdminPaginatedSupplies(logsPage, LOGS_PAGE_LIMIT);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Drivers log completed water can deliveries. Monitor and manage everything here.
        </p>
      </div>

      {statsError && !statsLoading && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          Could not load dashboard stats.
        </div>
      )}

      <div
        className="grid-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "2rem" }}
      >
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Active Customers</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
            {statsLoading ? "..." : stats?.customers ?? 0}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Today Deliveries</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
            {statsLoading ? "..." : stats?.todayDeliveries ?? 0}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Active Drivers</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
            {statsLoading ? "..." : stats?.drivers ?? 0}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Vehicles</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
            {statsLoading ? "..." : stats?.vehicles ?? 0}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/admin/customers" className="btn btn-primary">
          Manage Customers
        </Link>
        <Link href="/admin/drivers" className="btn btn-secondary">
          Manage Drivers
        </Link>
        <Link href="/admin/vehicles" className="btn btn-secondary">
          Manage Vehicles
        </Link>
        <Link href="/admin/supplies" className="btn btn-secondary">
          View Deliveries
        </Link>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "0.75rem" }}>
          <h2>Recent Deliveries</h2>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Last {LOGS_PAGE_LIMIT} per page</div>
        </div>

        {logsError && !logsLoading && (
          <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>
            Could not load recent deliveries.
          </div>
        )}

        {logsLoading && !logsData ? (
          <p style={{ color: "var(--text-muted)" }}>Loading recent deliveries...</p>
        ) : !logsData || logsData.logs.length === 0 ? (
          <div className="card empty-state">No delivery logs yet.</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Date & Time</th>
                    <th>Driver</th>
                    <th>Customer</th>
                    <th>Cans</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData.logs.map((log, index) => (
                    <tr key={log._id}>
                      <td>{(logsPage - 1) * LOGS_PAGE_LIMIT + index + 1}</td>
                      <td>
                        {log.formattedSuppliedAt ??
                          formatDateTime(log.suppliedAt)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.driver?.name}</div>
                        <div className="text-sm text-muted">@{log.driver?.username}</div>
                      </td>
                      <td>
                        {log.customer?.name ?? log.pointName ?? "-"}
                        {log.customer?.area && (
                          <div className="text-sm text-muted">{log.customer.area}</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {log.cansDelivered ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={logsPage <= 1 || logsLoading}
                onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Page {logsPage} of {logsData?.totalPages ?? 1}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={!logsData || logsPage >= logsData.totalPages || logsLoading}
                onClick={() =>
                  setLogsPage((p) => (!logsData ? p : Math.min(logsData.totalPages, p + 1)))
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
