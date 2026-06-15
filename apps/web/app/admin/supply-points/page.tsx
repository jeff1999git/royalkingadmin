"use client";

import Link from "next/link";

export default function SupplyPointsInfoPage() {
  return (
    <div className="card">
      <h1 style={{ marginBottom: "0.5rem" }}>Supply Points Are Driver-Logged</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Admin no longer creates supply points. Drivers add points when they complete a water supply call using the vehicle they used.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/admin/supplies" className="btn btn-primary">
          View Date-wise Supply Logs
        </Link>
        <Link href="/admin/vehicles" className="btn btn-secondary">
          Manage Vehicles
        </Link>
      </div>
    </div>
  );
}
