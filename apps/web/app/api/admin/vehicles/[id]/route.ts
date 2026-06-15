import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { connectToDatabase } from "../../../../../lib/mongodb";
import Vehicle from "../../../../../models/Vehicle";
import User from "../../../../../models/User";

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
    return NextResponse.json({ error: "Invalid vehicle id." }, { status: 400 });
  }

  const body = (await req.json()) as {
    name?: string;
    vehicleNumber?: string;
    capacity?: string;
    isActive?: boolean;
  };

  await connectToDatabase();
  const updates: {
    name?: string;
    vehicleNumber?: string;
    capacity?: string;
    isActive?: boolean;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updates.name = name;
  }

  if (typeof body.vehicleNumber === "string") {
    const vehicleNumber = body.vehicleNumber.trim().toUpperCase();
    if (!vehicleNumber) {
      return NextResponse.json({ error: "Vehicle number cannot be empty." }, { status: 400 });
    }
    const existing = await Vehicle.findOne({
      vehicleNumber,
      _id: { $ne: id },
    }).lean();
    if (existing) {
      return NextResponse.json({ error: "Vehicle number already exists." }, { status: 409 });
    }
    updates.vehicleNumber = vehicleNumber;
  }

  if (typeof body.capacity === "string") {
    const capacity = body.capacity.trim();
    if (!capacity) {
      return NextResponse.json({ error: "Capacity cannot be empty." }, { status: 400 });
    }
    updates.capacity = capacity;
  }

  if (typeof body.isActive === "boolean") {
    updates.isActive = body.isActive;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const vehicle = await Vehicle.findByIdAndUpdate(
    id,
    updates,
    { new: true }
  ).lean();

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  }

  return NextResponse.json(vehicle);
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
    return NextResponse.json({ error: "Invalid vehicle id." }, { status: 400 });
  }

  await connectToDatabase();
  const deleted = await Vehicle.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  }

  // Remove deleted vehicle from default driver assignment.
  await User.updateMany(
    { assignedVehicle: id },
    { $set: { assignedVehicle: null } }
  );

  return NextResponse.json({ success: true });
}
