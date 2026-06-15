import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { deleteImageFromCloudinary } from "../../../../../lib/cloudinary";
import { connectToDatabase } from "../../../../../lib/mongodb";
import SupplyLog from "../../../../../models/SupplyLog";
import Vehicle from "../../../../../models/Vehicle";

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
    pointName?: string;
    notes?: string;
    suppliedAt?: string;
    vehicleId?: string;
    cashType?: "debit" | "fuel";
  };
  const amountValue =
    body.amount === undefined || body.amount === null || body.amount === ""
      ? undefined
      : Number(body.amount);
  const adminRemark = body.adminRemark?.trim();
  const pointName = body.pointName?.trim();
  const notes = body.notes?.trim();
  const suppliedAt = body.suppliedAt ? new Date(body.suppliedAt) : undefined;
  const vehicleId = body.vehicleId?.trim();
  const cashType = body.cashType;

  if (amountValue !== undefined && (!Number.isFinite(amountValue) || amountValue < 0)) {
    return NextResponse.json({ error: "Amount must be a valid non-negative number." }, { status: 400 });
  }
  if (body.pointName !== undefined && !pointName) {
    return NextResponse.json({ error: "Point name cannot be empty." }, { status: 400 });
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

  await connectToDatabase();

  if (vehicleId !== undefined && vehicleId !== "") {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true }).lean();
    if (!vehicle) {
      return NextResponse.json({ error: "Selected vehicle is not available." }, { status: 400 });
    }
  }

  const setPayload: {
    amount?: number;
    adminRemark?: string;
    pointName?: string;
    notes?: string;
    suppliedAt?: Date;
    vehicle?: Types.ObjectId;
    cashType?: "debit" | "fuel";
  } = {};
  if (amountValue !== undefined) {
    setPayload.amount = amountValue;
  }
  if (adminRemark !== undefined) {
    setPayload.adminRemark = adminRemark;
  }
  if (pointName !== undefined) {
    setPayload.pointName = pointName;
  }
  if (body.notes !== undefined) {
    setPayload.notes = notes;
  }
  if (suppliedAt !== undefined) {
    setPayload.suppliedAt = suppliedAt;
  }
  if (vehicleId !== undefined && vehicleId !== "") {
    setPayload.vehicle = new Types.ObjectId(vehicleId);
  }
  if (cashType !== undefined) {
    setPayload.cashType = cashType;
  }

  if (Object.keys(setPayload).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updateResult = await SupplyLog.collection.updateOne(
    { _id: new Types.ObjectId(id) },
    { $set: setPayload }
  );

  if (updateResult.matchedCount === 0) {
    return NextResponse.json({ error: "Supply not found." }, { status: 404 });
  }

  const updated = await SupplyLog.findById(id)
    .populate("driver", "name username phone")
    .populate("vehicle", "name vehicleNumber capacity")
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
