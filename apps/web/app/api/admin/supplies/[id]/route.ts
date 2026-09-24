import { after, NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { badRequest, notFound, optionalNumber, optionalString, readJsonObject, serverError, unauthorized } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/authHelpers";
import { deleteImageFromCloudinary } from "../../../../../lib/cloudinary";
import { parseSuppliedAtInput } from "../../../../../lib/istTime";
import { connectToDatabase } from "../../../../../lib/mongodb";
import {
  autoAmount,
  isProductType,
  parseOptionalNumber,
  toProductType,
  validateDeliveryQuantities,
  type CaseSize,
  type DeliveryQuantities,
  type ProductType,
} from "../../../../../lib/supplyProduct";
import SupplyLog from "../../../../../models/SupplyLog";
import Vehicle from "../../../../../models/Vehicle";
import "../../../../../models/Customer";
import "../../../../../models/User";

type SetPayload = {
  amount?: number;
  adminRemark?: string;
  notes?: string;
  suppliedAt?: Date;
  vehicle?: Types.ObjectId;
  productType?: ProductType;
  cansDelivered?: number;
  cansTakenBack?: number;
  casesDelivered?: number;
  caseSize?: CaseSize;
  casePrice?: number;
  cashType?: "debit" | "fuel";
  paymentStatus?: "cash" | "upi" | "not_paid";
};

// A text field in the body: undefined = not sent, "" or null = clear it,
// otherwise the trimmed text.
function textField(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = optionalString(value, max);
  return text === undefined ? undefined : text === "" ? null : text;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid supply id.");

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  // amount: undefined = not sent (keep, or re-price if the quantity changed);
  // null/"" = clear it and re-price from the quantity; a number is explicit.
  let amountValue: number | null | undefined;
  if (body.amount === undefined) {
    amountValue = undefined;
  } else if (body.amount === null || body.amount === "") {
    amountValue = null;
  } else {
    amountValue = optionalNumber(body.amount);
    if (amountValue === undefined || amountValue < 0) return badRequest("Amount must be a valid non-negative number.");
  }
  const adminRemark = textField(body.adminRemark, 1000);
  const notes = textField(body.notes, 1000);
  const suppliedAt = body.suppliedAt === undefined ? undefined : parseSuppliedAtInput(body.suppliedAt);
  if (body.suppliedAt !== undefined && !suppliedAt) return badRequest("Invalid date/time.");
  const vehicleId = optionalString(body.vehicleId, 64);
  if (vehicleId && !Types.ObjectId.isValid(vehicleId)) return badRequest("Invalid vehicle id.");
  const cashType = body.cashType;
  if (cashType !== undefined && cashType !== "debit" && cashType !== "fuel") return badRequest("Invalid cash type.");
  const paymentStatus = body.paymentStatus;
  if (paymentStatus !== undefined && paymentStatus !== "cash" && paymentStatus !== "upi" && paymentStatus !== "not_paid") {
    return badRequest("Invalid payment status.");
  }
  if (body.productType !== undefined && !isProductType(body.productType)) return badRequest("Invalid product type.");

  const cansDelivered = parseOptionalNumber(body.cansDelivered);
  // null clears a saved "taken back"; undefined leaves it alone.
  const clearTakenBack = body.cansTakenBack === null;
  const cansTakenBack = clearTakenBack ? undefined : parseOptionalNumber(body.cansTakenBack);
  const casesDelivered = parseOptionalNumber(body.casesDelivered);
  const caseSize = optionalString(body.caseSize, 10) || undefined;
  const casePrice = parseOptionalNumber(body.casePrice);

  try {
    await connectToDatabase();

    if (vehicleId) {
      const vehicle = await Vehicle.exists({ _id: vehicleId, isActive: true });
      if (!vehicle) return badRequest("Selected vehicle is not available.");
    }

    const existing = await SupplyLog.findById(id)
      .select("logType productType customer cansDelivered cansTakenBack casesDelivered caseSize casePrice amount")
      .populate<{ customer?: { cashPerCan?: number } | null }>("customer", "cashPerCan")
      .lean();
    if (!existing) return notFound("Supply not found.");
    const isWater = existing.logType !== "cash";

    if (cashType !== undefined && isWater) return badRequest("Cash type applies to cash entries only.");
    if (paymentStatus !== undefined && !isWater) return badRequest("Payment status applies to deliveries only.");
    if (!isWater && amountValue === null) return badRequest("Please enter a valid amount.");

    const setPayload: SetPayload = {};
    const unsetPayload: Record<string, 1> = {};
    if (typeof amountValue === "number") setPayload.amount = amountValue;
    if (adminRemark === null) unsetPayload.adminRemark = 1;
    else if (adminRemark !== undefined) setPayload.adminRemark = adminRemark;
    if (notes === null) unsetPayload.notes = 1;
    else if (notes !== undefined) setPayload.notes = notes;
    if (suppliedAt) setPayload.suppliedAt = suppliedAt;
    if (vehicleId) setPayload.vehicle = new Types.ObjectId(vehicleId);
    if (cashType !== undefined) setPayload.cashType = cashType;
    if (paymentStatus !== undefined) setPayload.paymentStatus = paymentStatus;

    const touchesProduct =
      body.productType !== undefined ||
      cansDelivered !== undefined ||
      cansTakenBack !== undefined ||
      clearTakenBack ||
      casesDelivered !== undefined ||
      caseSize !== undefined ||
      casePrice !== undefined;
    if (touchesProduct && !isWater) return badRequest("Product fields apply to deliveries only.");

    const currentType = toProductType(existing.productType);
    // Re-prices the row from the given quantities: sets the amount when it can
    // be priced, otherwise clears it when asked to.
    const reprice = (priced: DeliveryQuantities, clearIfUnpriceable: boolean) => {
      const amount = autoAmount(existing.customer, priced);
      if (amount !== undefined) setPayload.amount = amount;
      else if (clearIfUnpriceable) unsetPayload.amount = 1;
    };

    if (touchesProduct) {
      const targetType = isProductType(body.productType) ? body.productType : currentType;
      // Sending "can" for an older row with no productType just records it;
      // that is not a switch.
      const switching = targetType !== currentType;
      const quantities: DeliveryQuantities = { productType: targetType, cansDelivered, cansTakenBack, casesDelivered, caseSize, casePrice };
      // A switch must carry everything the new product needs; a plain edit may
      // leave fields out.
      const quantityError = validateDeliveryQuantities(quantities, { partial: !switching });
      if (quantityError) return badRequest(quantityError);

      if (body.productType !== undefined) setPayload.productType = targetType;
      let quantityChanged = switching;
      if (targetType === "case") {
        if (casesDelivered !== undefined) setPayload.casesDelivered = casesDelivered;
        if (caseSize !== undefined) setPayload.caseSize = caseSize as CaseSize; // validated above
        if (casePrice !== undefined) setPayload.casePrice = casePrice;
        if (switching) {
          unsetPayload.cansDelivered = 1;
          unsetPayload.cansTakenBack = 1;
        }
        if (casesDelivered !== undefined && casesDelivered !== existing.casesDelivered) quantityChanged = true;
        if (casePrice !== undefined && casePrice !== existing.casePrice) quantityChanged = true;
      } else {
        if (cansDelivered !== undefined) setPayload.cansDelivered = cansDelivered;
        if (cansTakenBack !== undefined) setPayload.cansTakenBack = cansTakenBack;
        if (clearTakenBack) unsetPayload.cansTakenBack = 1;
        if (switching) {
          unsetPayload.casesDelivered = 1;
          unsetPayload.caseSize = 1;
          unsetPayload.casePrice = 1;
        }
        if (cansDelivered !== undefined && cansDelivered !== existing.cansDelivered) quantityChanged = true;
      }

      // An explicit amount wins. Otherwise the row is re-priced only when the
      // product or a priced quantity actually changed (or the admin cleared the
      // amount): a remark or payment-status edit never touches the amount.
      // Cans are priced from the customer's rate, cases from cases × price per
      // case, using the saved value for whichever wasn't sent. After a switch
      // an amount priced as the other product is never kept.
      if (amountValue === null || (amountValue === undefined && quantityChanged)) {
        const priced: DeliveryQuantities = switching
          ? quantities
          : targetType === "case"
            ? { ...quantities, casesDelivered: casesDelivered ?? existing.casesDelivered, casePrice: casePrice ?? existing.casePrice }
            : { ...quantities, cansDelivered: cansDelivered ?? existing.cansDelivered };
        reprice(priced, switching || amountValue === null);
      }
    } else if (amountValue === null && isWater) {
      // Clearing the amount on its own: price the saved quantities again.
      reprice(
        {
          productType: currentType,
          cansDelivered: existing.cansDelivered,
          cansTakenBack: existing.cansTakenBack,
          casesDelivered: existing.casesDelivered,
          caseSize: existing.caseSize,
          casePrice: existing.casePrice,
        },
        true,
      );
    }

    const hasUnset = Object.keys(unsetPayload).length > 0;
    if (Object.keys(setPayload).length === 0 && !hasUnset) return badRequest("Nothing to update.");

    const updateOp: { $set: SetPayload; $unset?: Record<string, 1> } = { $set: setPayload };
    if (hasUnset) updateOp.$unset = unsetPayload;

    const updated = await SupplyLog.findByIdAndUpdate(id, updateOp, { returnDocument: "after" })
      .select("-billImagePublicId -__v")
      .populate("driver", "name username phone")
      .populate("vehicle", "name vehicleNumber capacity")
      .populate("customer", "name phone area")
      .lean();
    if (!updated) return notFound("Supply not found.");

    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err, "Failed to update. Please try again.");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid supply id.");

  try {
    await connectToDatabase();

    const deleted = await SupplyLog.findByIdAndDelete(id).select("billImagePublicId").lean();
    if (!deleted) return notFound("Supply not found.");

    // The bill photo is cleaned up after the response is sent; the admin
    // doesn't wait on Cloudinary, and a failure there changes nothing.
    const publicId = deleted.billImagePublicId;
    if (publicId) {
      after(() => deleteImageFromCloudinary(publicId).catch((err) => console.error("[supplies DELETE] image cleanup", err)));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err, "Failed to delete supply log.");
  }
}
