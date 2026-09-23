// Can / case product rules for water deliveries, shared by the API routes and
// the driver/admin forms so validation copy and pricing never drift apart.
//
// A delivery row carries exactly one quantity family matching its productType:
// cansDelivered (+ cansTakenBack) for "can"; casesDelivered, caseSize and
// casePrice for "case". Rows written before productType existed have no field
// and read as "can".

export type ProductType = "can" | "case";

export function isProductType(value: unknown): value is ProductType {
  return value === "can" || value === "case";
}

// Legacy-safe read: a missing or unknown value means "can".
export function toProductType(value: unknown): ProductType {
  return value === "case" ? "case" : "can";
}

// Bottle sizes a case can hold, stored on the row exactly as written here.
export const CASE_SIZES = ["300ml", "500ml", "1L", "2L"] as const;
export type CaseSize = (typeof CASE_SIZES)[number];

export function isCaseSize(value: unknown): value is CaseSize {
  return typeof value === "string" && (CASE_SIZES as readonly string[]).includes(value);
}

export function productLabel(productType: ProductType): "Can" | "Case" {
  return productType === "case" ? "Case" : "Can";
}

export function unitWord(productType: ProductType, count: number): string {
  if (productType === "case") return count === 1 ? "case" : "cases";
  return count === 1 ? "can" : "cans";
}

// Blank ("", null, undefined) means "not given"; anything else is a number
// (possibly NaN, which the validators reject).
export function parseOptionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null || value === "" ? undefined : Number(value);
}

export type DeliveryQuantities = {
  productType: ProductType;
  cansDelivered?: number;
  cansTakenBack?: number;
  casesDelivered?: number;
  // Raw from the request; validateDeliveryQuantities checks it is a CaseSize.
  caseSize?: string;
  // ₹ for one case, typed by the driver or admin.
  casePrice?: number;
};

const isNonNegativeInteger = (n: number) => Number.isInteger(n) && n >= 0;

// Returns the error message for a 400, or null when the quantities are valid.
// `partial` is for edits that leave the quantity untouched: it skips the
// "enter a quantity" rule but still enforces the other rules.
export function validateDeliveryQuantities(
  q: DeliveryQuantities,
  opts?: { partial?: boolean }
): string | null {
  // Checked in the order the fields appear on the forms.
  if (q.productType === "case") {
    if (q.cansDelivered !== undefined || q.cansTakenBack !== undefined) {
      return "Cans fields do not apply to a case delivery.";
    }
    if (!opts?.partial && q.caseSize === undefined) {
      return "Choose the bottle size.";
    }
    if (q.caseSize !== undefined && !isCaseSize(q.caseSize)) {
      return "Bottle size must be 300ml, 500ml, 1L or 2L.";
    }
    if (!opts?.partial && q.casesDelivered === undefined) {
      return "Enter cases delivered.";
    }
    if (q.casesDelivered !== undefined && (!Number.isInteger(q.casesDelivered) || q.casesDelivered < 1)) {
      return "Cases delivered must be a positive integer.";
    }
    if (!opts?.partial && q.casePrice === undefined) {
      return "Enter the price per case.";
    }
    if (q.casePrice !== undefined && (!Number.isFinite(q.casePrice) || q.casePrice < 0)) {
      return "Price per case must be a valid non-negative number.";
    }
    return null;
  }

  if (q.casesDelivered !== undefined) {
    return "Cases delivered does not apply to a can delivery.";
  }
  if (q.caseSize !== undefined || q.casePrice !== undefined) {
    return "Bottle size and price per case only apply to case deliveries.";
  }
  if (!opts?.partial && q.cansDelivered === undefined && q.cansTakenBack === undefined) {
    return "Enter cans delivered, cans taken back, or both.";
  }
  if (q.cansDelivered !== undefined && !isNonNegativeInteger(q.cansDelivered)) {
    return "Cans delivered must be a non-negative integer.";
  }
  if (q.cansTakenBack !== undefined && !isNonNegativeInteger(q.cansTakenBack)) {
    return "Cans taken back must be a non-negative integer.";
  }
  return null;
}

// The row's delivered quantity in its own unit (cans or cases).
export function deliveredQuantity(row: {
  productType?: string | null;
  cansDelivered?: number;
  casesDelivered?: number;
}): number | undefined {
  return toProductType(row.productType) === "case" ? row.casesDelivered : row.cansDelivered;
}

// The only auto-pricing rule. Cans: cans × the customer's rate per can.
// Cases: cases × the price per case entered with the delivery. Undefined when
// either factor is missing, so the amount stays blank.
export function autoAmount(
  customer: { cashPerCan?: number } | null | undefined,
  q: DeliveryQuantities
): number | undefined {
  if (q.productType === "case") {
    if (q.casesDelivered === undefined || q.casePrice === undefined) return undefined;
    return Math.round(q.casesDelivered * q.casePrice * 100) / 100;
  }
  const rate = customer?.cashPerCan;
  return q.cansDelivered !== undefined && rate !== undefined ? q.cansDelivered * rate : undefined;
}

// "3 × ₹120 = ₹360" preview for the case forms, or null until both are valid.
export function casePricePreview(cases: number | undefined, price: number | undefined): string | null {
  if (cases === undefined || price === undefined) return null;
  if (!Number.isInteger(cases) || cases < 1 || !Number.isFinite(price) || price < 0) return null;
  const total = Math.round(cases * price * 100) / 100;
  return `${cases} × ₹${price.toLocaleString("en-IN")} = ₹${total.toLocaleString("en-IN")}`;
}

// $group accumulator for case totals. Can and legacy rows never carry
// casesDelivered, so they add 0; $cansDelivered sums stay can-only.
export const SUM_CASES = { $sum: { $ifNull: ["$casesDelivered", 0] } };

// $group accumulators for cases of each bottle size, keyed case_300ml etc.
export const CASE_SIZE_GROUP = Object.fromEntries(
  CASE_SIZES.map((size) => [
    `case_${size}`,
    { $sum: { $cond: [{ $eq: ["$caseSize", size] }, { $ifNull: ["$casesDelivered", 0] }, 0] } },
  ])
);

export type CasesBySize = Record<CaseSize, number>;

export function emptyCasesBySize(): CasesBySize {
  return Object.fromEntries(CASE_SIZES.map((size) => [size, 0])) as CasesBySize;
}

// Reads the CASE_SIZE_GROUP keys back out of a $group result.
export function casesBySizeFrom(group: Record<string, unknown> | undefined): CasesBySize {
  const bySize = emptyCasesBySize();
  for (const size of CASE_SIZES) {
    const value = group?.[`case_${size}`];
    bySize[size] = typeof value === "number" ? value : 0;
  }
  return bySize;
}

// "500ml 4 · 1L 5" — sizes with cases only, plus "size not set N" for case
// rows saved without a size. Empty when there are no cases.
export function casesBySizeText(bySize: Partial<CasesBySize> | undefined, totalCases: number): string {
  const parts = CASE_SIZES.filter((size) => (bySize?.[size] ?? 0) > 0).map((size) => `${size} ${bySize?.[size]}`);
  const sized = CASE_SIZES.reduce((sum, size) => sum + (bySize?.[size] ?? 0), 0);
  if (totalCases > sized) parts.push(`size not set ${totalCases - sized}`);
  return parts.join(" · ");
}
