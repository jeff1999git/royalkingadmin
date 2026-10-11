// "Cash" / "UPI" / "Not Paid" badge for a delivery. Rows saved before the
// field existed have no paymentStatus and count as cash.

export type PaymentStatus = "cash" | "upi" | "not_paid";

export function paymentLabel(status?: PaymentStatus | null): "Cash" | "UPI" | "Not Paid" {
  return !status || status === "cash" ? "Cash" : status === "upi" ? "UPI" : "Not Paid";
}

const STYLES: Record<"Cash" | "UPI" | "Not Paid", { background: string; color: string }> = {
  Cash: { background: "#e8f5e9", color: "#2e7d32" },
  UPI: { background: "#e3f2fd", color: "#1565c0" },
  "Not Paid": { background: "#fff3e0", color: "#e65100" },
};

export default function PaymentPill({ status, size = "md" }: { status?: PaymentStatus | null; size?: "sm" | "md" }) {
  const label = paymentLabel(status);
  return (
    <span
      style={{
        display: "inline-block",
        fontWeight: 700,
        fontSize: size === "sm" ? "0.72rem" : "0.82rem",
        padding: size === "sm" ? "0.1rem 0.45rem" : "0.18rem 0.6rem",
        borderRadius: "99px",
        ...STYLES[label],
      }}
    >
      {label}
    </span>
  );
}
