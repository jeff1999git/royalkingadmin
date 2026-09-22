// Can / case product rules for water deliveries, shared by the API routes and
// the driver/admin forms so validation copy and pricing never drift apart.
//
// A delivery row carries exactly one quantity family matching its productType:
// cansDelivered (+ cansTakenBack) for "can", casesDelivered for "case". Rows
// written before productType existed have no field and read as "can".

export type ProductType = "can" | "case";

export function isProductType(value: unknown): value is ProductType {
  return value === "can" || value === "case";
}

// Legacy-safe read: a missing or unknown value means "can".
export function toProductType(value: unknown): ProductType {
  return value === "case" ? "case" : "can";
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
};

const isNonNegativeInteger = (n: number) => Number.isInteger(n) && n >= 0;

// Returns the error message for a 400, or null when the quantities are valid.
// `partial` is for edits that leave the quantity untouched: it skips the
// "enter a quantity" rule but still enforces the other rules.
export function validateDeliveryQuantities(
  q: DeliveryQuantities,
  opts?: { partial?: boolean }
): string | null {
  if (q.productType === "case") {
    if (q.cansDelivered !== undefined || q.cansTakenBack !== undefined) {
      return "Cans fields do not apply to a case delivery.";
    }
    if (!opts?.partial && q.casesDelivered === undefined) {
      return "Enter cases delivered.";
    }
    if (q.casesDelivered !== undefined && (!Number.isInteger(q.casesDelivered) || q.casesDelivered < 1)) {
      return "Cases delivered must be a positive integer.";
    }
    return null;
  }

  if (q.casesDelivered !== undefined) {
    return "Cases delivered does not apply to a can delivery.";
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

export type CustomerRates = { cashPerCan?: number; cashPerCase?: number };

export function rateFor(rates: CustomerRates | null | undefined, productType: ProductType): number | undefined {
  return productType === "case" ? rates?.cashPerCase : rates?.cashPerCan;
}

// The only auto-pricing rule: quantity × the customer's rate for the SAME
// product. Undefined when either is missing, so the amount stays blank.
export function autoAmount(
  rates: CustomerRates | null | undefined,
  q: DeliveryQuantities
): number | undefined {
  const quantity = deliveredQuantity(q);
  const rate = rateFor(rates, q.productType);
  return quantity !== undefined && rate !== undefined ? quantity * rate : undefined;
}

// $group accumulator for case totals. Can and legacy rows never carry
// casesDelivered, so they add 0; $cansDelivered sums stay can-only.
export const SUM_CASES = { $sum: { $ifNull: ["$casesDelivered", 0] } };
