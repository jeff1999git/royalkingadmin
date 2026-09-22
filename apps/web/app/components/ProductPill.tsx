import { productLabel, toProductType } from "../../lib/supplyProduct";

// Can / Case marker for a delivery row. Rows saved before the product choice
// existed have no productType and show "Can".
export default function ProductPill({
  productType,
  size = "md",
}: {
  productType?: string | null;
  size?: "sm" | "md";
}) {
  const pt = toProductType(productType);
  return (
    <span
      className={`badge ${pt === "case" ? "badge-case" : "badge-can"}`}
      style={size === "sm" ? { fontSize: "0.68rem", padding: "0.1rem 0.45rem" } : undefined}
    >
      {productLabel(pt)}
    </span>
  );
}
