import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { deleteImageFromCloudinary } from "../../../../../lib/cloudinary";
import { connectToDatabase } from "../../../../../lib/mongodb";
import {
  autoAmount,
  deliveredQuantity,
  isProductType,
  parseOptionalNumber,
  toProductType,
  validateDeliveryQuantities,
  type DeliveryQuantities,
  type ProductType,
} from "../../../../../lib/supplyProduct";
import SupplyLog from "../../../../../models/SupplyLog";
import Vehicle from "../../../../../models/Vehicle";
import "../../../../../models/Customer";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid supply id." }, { status: 400 });
  }

  const body = (await req.json()) as {
    amount?: number | string;
    adminRemark?: string;
    notes?: string;
    suppliedAt?: string;
    vehicleId?: string;
    productType?: "can" | "case";
    cansDelivered?: number | string;
    cansTakenBack?: number | string;
    casesDelivered?: number | string;
    cashType?: "debit" | "fuel";
    paymentStatus?: "cash" | "upi" | "not_paid";
  };
  const amountValue =
    body.amount === undefined || body.amount === null || body.amount === ""
      ? undefined
      : Number(body.amount);
  const adminRemark = body.adminRemark?.trim();
  const notes = body.notes?.trim();
  const suppliedAt = body.suppliedAt ? new Date(body.suppliedAt) : undefined;
  const vehicleId = body.vehicleId?.trim();
  const cashType = body.cashType;
  const cansDelivered = parseOptionalNumber(body.cansDelivered);
  const cansTakenBack = parseOptionalNumber(body.cansTakenBack);
  const casesDelivered = parseOptionalNumber(body.casesDelivered);

  if (amountValue !== undefined && (!Number.isFinite(amountValue) || amountValue < 0)) {
    return NextResponse.json({ error: "Amount must be a valid non-negative number." }, { status: 400 });
  }
  if (body.suppliedAt !== undefined && (!suppliedAt || Number.isNaN(suppliedAt.getTime()))) {
    return NextResponse.json({ error: "Invalid date/time." }, { status: 400 });
  }
  if (vehicleId !== undefined && vehicleId !== "" && !Types.ObjectId.isValid(vehicleId)) {
    return NextResponse.json({ error: "Invalid vehicle id." }, { status: 400 });
  }
  if (cashType !== undefined && cashType !== "debit" && cashType !== "fuel") {
    return NextResponse.json({ error: "Invalid cash type." }, { status: 400 });
  }
  if (body.productType !== undefined && !isProductType(body.productType)) {
    return NextResponse.json({ error: "Invalid product type." }, { status: 400 });
  }

  await connectToDatabase();

  if (vehicleId !== undefined && vehicleId !== "") {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true }).lean();
    if (!vehicle) {
      return NextResponse.json({ error: "Selected vehicle is not available." }, { status: 400 });
    }
  }

  const paymentStatus = body.paymentStatus;
  if (paymentStatus !== undefined && paymentStatus !== "cash" && paymentStatus !== "upi" && paymentStatus !== "not_paid") {
    return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
  }

  const setPayload: {
    amount?: number;
    adminRemark?: string;
    notes?: string;
    suppliedAt?: Date;
    vehicle?: Types.ObjectId;
    productType?: ProductType;
    cansDelivered?: number;
    cansTakenBack?: number;
    casesDelivered?: number;
    cashType?: "debit" | "fuel";
    paymentStatus?: "cash" | "upi" | "not_paid";
  } = {};
  const unsetPayload: Record<string, 1> = {};
  if (amountValue !== undefined) setPayload.amount = amountValue;
  if (adminRemark !== undefined) setPayload.adminRemark = adminRemark;
  if (body.notes !== undefined) setPayload.notes = notes;
  if (suppliedAt !== undefined) setPayload.suppliedAt = suppliedAt;
  if (vehicleId !== undefined && vehicleId !== "") {
    setPayload.vehicle = new Types.ObjectId(vehicleId);
  }

  const touchesProduct =
    body.productType !== undefined ||
    cansDelivered !== undefined ||
    cansTakenBack !== undefined ||
    casesDelivered !== undefined;
  if (touchesProduct) {
    const existingLog = await SupplyLog.findById(id)
      .select("logType productType customer")
      .populate<{ customer?: { cashPerCan?: number; cashPerCase?: number } | null }>("customer", "cashPerCan cashPerCase")
      .lean();
    if (!existingLog) {
      return NextResponse.json({ error: "Supply not found." }, { status: 404 });
    }
    if (existingLog.logType !== "water") {
      return NextResponse.json({ error: "Product fields apply to deliveries only." }, { status: 400 });
    }

    const currentType = toProductType(existingLog.productType);
    const targetType = body.productType ?? currentType;
    // Sending "can" for an older row with no productType just records it; that
    // is not a switch.
    const switching = targetType !== currentType;
    const quantities: DeliveryQuantities = { productType: targetType, cansDelivered, cansTakenBack, casesDelivered };
    // A switch must carry the new product's quantity; a plain edit may leave it out.
    const quantityError = validateDeliveryQuantities(quantities, { partial: !switching });
    if (quantityError) {
      return NextResponse.json({ error: quantityError }, { status: 400 });
    }

    if (body.productType !== undefined) setPayload.productType = targetType;
    if (targetType === "case") {
      if (casesDelivered !== undefined) setPayload.casesDelivered = casesDelivered;
      if (switching) {
        unsetPayload.cansDelivered = 1;
        unsetPayload.cansTakenBack = 1;
      }
    } else {
      if (cansDelivered !== undefined) setPayload.cansDelivered = cansDelivered;
      if (cansTakenBack !== undefined) setPayload.cansTakenBack = cansTakenBack;
      if (switching) unsetPayload.casesDelivered = 1;
    }

    // An amount sent in the body wins. Otherwise re-price from the customer's
    // rate for the row's (new) product. After a switch, an amount that was
    // priced in the other unit is never kept: it is cleared if there is no rate.
    if (amountValue === undefined && (switching || deliveredQuantity(quantities) !== undefined)) {
      const amount = autoAmount(existingLog.customer, quantities);
      if (amount !== undefined) setPayload.amount = amount;
      else if (switching) unsetPayload.amount = 1;
    }
  }
  if (cashType !== undefined) setPayload.cashType = cashType;
  if (paymentStatus !== undefined) setPayload.paymentStatus = paymentStatus;

  const hasUnset = Object.keys(unsetPayload).length > 0;
  if (Object.keys(setPayload).length === 0 && !hasUnset) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updateOp: { $set: typeof setPayload; $unset?: Record<string, 1> } = { $set: setPayload };
  if (hasUnset) updateOp.$unset = unsetPayload;

  const updated = await SupplyLog.findByIdAndUpdate(id, updateOp, { new: true })
    .populate("driver", "name username phone")
    .populate("vehicle", "name vehicleNumber capacity")
    .populate("customer", "name phone area")
    .lean();

  if (!updated) {
    return NextResponse.json({ error: "Supply not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid supply id." }, { status: 400 });
  }

  await connectToDatabase();

  const deleted = await SupplyLog.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Supply not found." }, { status: 404 });
  }

  await deleteImageFromCloudinary(deleted.billImagePublicId).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
