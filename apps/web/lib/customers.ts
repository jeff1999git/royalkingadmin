// Customer creation shared by the admin and driver registration routes.
// A phone number is unique, but DELETE only soft-deletes, so re-registering a
// returning customer restores the deleted record in place instead of failing
// on the unique index nobody can see past.

import { Types } from "mongoose";
import Customer from "../models/Customer";

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  area?: string;
  locationType?: "home" | "office" | "both";
  subscriptionCans: number;
  cashPerCan?: number;
  securityDeposit?: number;
  registeredDate?: Date;
  createdBy?: string;
};

export type CreateOrRestoreResult =
  | { customer: Record<string, unknown>; restored: boolean }
  | { duplicate: true };

const OPTIONAL_FIELDS = ["email", "address", "area", "locationType", "cashPerCan", "securityDeposit", "createdBy"] as const;

function isDuplicateKeyError(err: unknown) {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code?: unknown }).code === 11000);
}

/**
 * Creates a customer, or restores a soft-deleted one with the same phone.
 * Returns { duplicate: true } when a live customer already has that phone.
 * The caller must have connected to the database.
 */
export async function createOrRestoreCustomer(input: CustomerInput): Promise<CreateOrRestoreResult> {
  const fields: Record<string, unknown> = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
    area: input.area,
    locationType: input.locationType,
    subscriptionCans: input.subscriptionCans,
    cashPerCan: input.cashPerCan,
    securityDeposit: input.securityDeposit,
    createdBy: input.createdBy && Types.ObjectId.isValid(input.createdBy) ? input.createdBy : undefined,
  };
  const registeredDate = input.registeredDate ?? new Date();

  try {
    const existing = await Customer.findOne({ phone: input.phone }).select("_id isDeleted").lean();
    if (existing && !existing.isDeleted) return { duplicate: true };

    if (existing) {
      // Restore in place: every input field is set, and optional fields the
      // new registration leaves out are cleared so stale data doesn't linger.
      const $set: Record<string, unknown> = { isDeleted: false, isActive: true, registeredDate };
      const $unset: Record<string, 1> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) $set[key] = value;
      }
      for (const key of OPTIONAL_FIELDS) {
        if (fields[key] === undefined) $unset[key] = 1;
      }
      const update: Record<string, unknown> = { $set };
      if (Object.keys($unset).length > 0) update.$unset = $unset;
      const restored = await Customer.findByIdAndUpdate(existing._id, update, { returnDocument: "after" }).lean();
      if (!restored) return { duplicate: true };
      return { customer: restored as unknown as Record<string, unknown>, restored: true };
    }

    const created = await Customer.create({ ...fields, registeredDate });
    return { customer: created.toObject() as unknown as Record<string, unknown>, restored: false };
  } catch (err) {
    if (isDuplicateKeyError(err)) return { duplicate: true };
    throw err;
  }
}
