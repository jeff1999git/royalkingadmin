import { productLabel, toProductType } from "../../lib/supplyProduct";

// Can / Case marker for a delivery row, with the bottle size on cases
// ("Case · 500ml"). Rows saved before the product choice existed have no
// productType and show "Can".
export default function ProductPill({
  productType,
  caseSize,
  size = "md",
}: {
  productType?: string | null;
  caseSize?: string | null;
  size?: "sm" | "md";
}) {
  const pt = toProductType(productType);
  const label = pt === "case" && caseSize ? `${productLabel(pt)} · ${caseSize}` : productLabel(pt);
  return (
    <span
      className={`badge ${pt === "case" ? "badge-case" : "badge-can"}`}
      style={size === "sm" ? { fontSize: "0.68rem", padding: "0.1rem 0.45rem" } : undefined}
    >
      {label}
    </span>
  );
}
