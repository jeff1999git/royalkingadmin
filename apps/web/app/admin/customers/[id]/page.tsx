"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  locationTypeLabel,
  useAdminCustomerDetail,
  useAdminCustomerHistory,
} from "../../../hooks/useAdminQueries";
import { casesBySizeText, deliveredQuantity } from "../../../../lib/supplyProduct";
import { formatDateTime, formatMoney, istToday } from "../../../../lib/format";
import PaymentPill from "../../../components/PaymentPill";
import ProductPill from "../../../components/ProductPill";

export default function CustomerHistoryPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id ?? "";

  const maxMonth = istToday().slice(0, 7);

  const [filters, setFilters] = useState({ month: "", paymentStatus: "" });
  const [page, setPage] = useState(1);

  // Back to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const {
    data: customer,
    isLoading: customerLoading,
    isError: customerError,
    error: customerFetchError,
    isFetching: customerFetching,
    refetch: refetchCustomer,
  } = useAdminCustomerDetail(customerId);
  // Only a 404 means the customer doesn't exist; anything else is a failed load.
  const customerNotFound =
    customerError && (customerFetchError as (Error & { status?: number }) | null)?.status === 404;

  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    isError: historyError,
  } = useAdminCustomerHistory(customerId, filters, page);

  const logs = historyData?.logs ?? [];
  const totalPages = historyData?.totalPages ?? 1;
  const stats = historyData?.stats;
  const serialStart = historyData?.serialStart ?? (page - 1) * (historyData?.limit ?? 50);

  const hasAnyFilter = Boolean(filters.month || filters.paymentStatus);

  const addedDate = useMemo(() => {
    const iso = customer?.registeredDate ?? customer?.createdAt;
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [customer?.registeredDate, customer?.createdAt]);

  if (customerNotFound) {
    return (
      <div>
        <div className="card empty-state" style={{ marginBottom: "1rem" }}>
          Customer not found.
        </div>
        <Link href="/admin/customers" className="btn btn-secondary btn-sm">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <h1>{customerLoading ? "Customer" : customer?.name ?? "Customer"}</h1>
        <Link href="/admin/customers" className="btn btn-secondary btn-sm">
          Back to Customers
        </Link>
      </div>

      {/* Customer details */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        {customerLoading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading customer...</p>
        ) : customerError ? (
          <>
            <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>Failed to load customer.</div>
            <button type="button" className="btn btn-secondary btn-sm" disabled={customerFetching} onClick={() => void refetchCustomer()}>
              {customerFetching ? "Retrying..." : "Try again"}
            </button>
          </>
        ) : customer ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "0.75rem 1rem",
            }}
          >
            <div>
              <div className="text-sm text-muted">Phone</div>
              <div style={{ fontWeight: 600 }}>{customer.phone}</div>
            </div>
            {customer.area && (
              <div>
                <div className="text-sm text-muted">Area</div>
                <div style={{ fontWeight: 600 }}>{customer.area}</div>
              </div>
            )}
            {customer.address && (
              <div>
                <div className="text-sm text-muted">Location</div>
                <div style={{ fontWeight: 500 }}>{customer.address}</div>
              </div>
            )}
            {customer.locationType && (
              <div>
                <div className="text-sm text-muted">Type</div>
                <div style={{ fontWeight: 600 }}>{locationTypeLabel(customer.locationType)}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted">Subscription</div>
              <div style={{ fontWeight: 600 }}>
                {customer.subscriptionCans} can{customer.subscriptionCans !== 1 ? "s" : ""}/day
              </div>
            </div>
            {customer.cashPerCan !== undefined && (
              <div>
                <div className="text-sm text-muted">Cash Per Can</div>
                <div style={{ fontWeight: 600 }}>{formatMoney(customer.cashPerCan)}</div>
              </div>
            )}
            {customer.securityDeposit !== undefined && (
              <div>
                <div className="text-sm text-muted">Security Deposit</div>
                <div style={{ fontWeight: 600 }}>{formatMoney(customer.securityDeposit)}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted">Status</div>
              <div
                style={{
                  fontWeight: 600,
                  color: customer.isDeleted ? "var(--danger)" : customer.isActive ? "var(--accent-primary)" : "var(--text-muted)",
                }}
              >
                {customer.isDeleted ? "Deleted" : customer.isActive ? "Active" : "Inactive"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted">Added Date</div>
              <div style={{ fontWeight: 600 }}>{addedDate}</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="historyMonth">Month</label>
            <input
              id="historyMonth"
              type="month"
              className="form-input"
              value={filters.month}
              max={maxMonth}
              onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="historyPayment">Payment</label>
            <select
              id="historyPayment"
              className="form-select"
              value={filters.paymentStatus}
              onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
            >
              <option value="">All Payments</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="not_paid">Not Paid</option>
            </select>
          </div>
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: "0.5rem" }}
            onClick={() => setFilters({ month: "", paymentStatus: "" })}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary */}
      <div
        className="card"
        style={{
          marginBottom: "1rem",
          padding: "0.65rem 0.9rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          display: "flex",
          gap: "0.9rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span><strong style={{ color: "var(--text-primary)" }}>Deliveries:</strong> {historyData?.total ?? 0}</span>
        <span><strong style={{ color: "var(--text-primary)" }}>Cans Del.:</strong> {stats?.totalCans ?? 0}</span>
        <span>
          <strong style={{ color: "var(--text-primary)" }}>Cases Del.:</strong> {stats?.totalCases ?? 0}
          {casesBySizeText(stats?.casesBySize, stats?.totalCases ?? 0) && ` (${casesBySizeText(stats?.casesBySize, stats?.totalCases ?? 0)})`}
        </span>
        <span><strong style={{ color: "var(--text-primary)" }}>Taken Back:</strong> {stats?.totalCansTakenBack ?? 0}</span>
        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Total Amount: {formatMoney(stats?.totalAmount)}
        </span>
        {!hasAnyFilter && <span style={{ marginLeft: "auto" }}>All time</span>}
      </div>

      {historyError && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          Failed to load history. Please try again.
        </div>
      )}

      {/* History */}
      {historyLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading history...</p>
      ) : logs.length === 0 ? (
        <div className="card empty-state">
          {hasAnyFilter
            ? "No deliveries for selected filters."
            : "No deliveries recorded for this customer yet."}
        </div>
      ) : (
        <div className="table-wrapper" style={{ opacity: historyFetching ? 0.6 : 1 }}>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date & Time</th>
                <th>Qty</th>
                <th>Taken Back</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Driver</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log._id}>
                  <td>{serialStart + index + 1}</td>
                  <td>{formatDateTime(log.suppliedAt)}</td>
                  <td style={{ fontWeight: 700 }}>
                    {deliveredQuantity(log) ?? "-"}
                    <div style={{ marginTop: "0.15rem" }}><ProductPill productType={log.productType} caseSize={log.caseSize} size="sm" /></div>
                  </td>
                  <td>{log.cansTakenBack ?? "-"}</td>
                  <td>{log.amount !== undefined ? formatMoney(log.amount) : "-"}</td>
                  <td><PaymentPill status={log.paymentStatus} size="sm" /></td>
                  <td>{log.driver?.name ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!historyLoading && totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
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
  );
}
