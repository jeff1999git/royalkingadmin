import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { badRequest, jsonError, notFound, readJsonObject, serverError, unauthorized } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/authHelpers";
import { connectToDatabase } from "../../../../../lib/mongodb";
import Vehicle from "../../../../../models/Vehicle";
import User from "../../../../../models/User";
import SupplyLog from "../../../../../models/SupplyLog";

// The admin vehicle page charts recent readings; the array grows by one entry
// per driver-day forever, so only the newest entries are sent.
const MAX_HISTORY_ENTRIES = 200;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid vehicle id.");

  try {
    await connectToDatabase();
    const vehicle = await Vehicle.findById(id)
      .select({
        name: 1,
        vehicleNumber: 1,
        capacity: 1,
        isActive: 1,
        odometer: 1,
        odometerLastUpdated: 1,
        createdAt: 1,
        odometerHistory: { $slice: -MAX_HISTORY_ENTRIES },
      })
      .lean();

    if (!vehicle) return notFound("Vehicle not found.");

    return NextResponse.json(vehicle);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid vehicle id.");

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  const updates: {
    name?: string;
    vehicleNumber?: string;
    capacity?: string;
    isActive?: boolean;
  } = {};

  // "Number" (registration) is stored in `name`; "Model" in `vehicleNumber`.
  let name: string | undefined;
  if (typeof body.name === "string") {
    name = body.name.trim();
    if (!name) return badRequest("Number cannot be empty.");
  }

  if (typeof body.vehicleNumber === "string") {
    const vehicleNumber = body.vehicleNumber.trim();
    if (!vehicleNumber) return badRequest("Model cannot be empty.");
    updates.vehicleNumber = vehicleNumber;
  }

  if (typeof body.capacity === "string") {
    const capacity = body.capacity.trim();
    if (!capacity) return badRequest("Capacity cannot be empty.");
    updates.capacity = capacity;
  }

  if (typeof body.isActive === "boolean") {
    updates.isActive = body.isActive;
  }

  try {
    await connectToDatabase();

    if (name !== undefined) {
      // Two vehicles can share a model, but not a registration number.
      const existing = await Vehicle.exists({
        name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        _id: { $ne: id },
      });
      if (existing) return jsonError("A vehicle with this number already exists.", 409);
      updates.name = name;
    }

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields to update.");
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      updates,
      { returnDocument: "after" }
    )
      .select("-odometerHistory")
      .lean();

    if (!vehicle) return notFound("Vehicle not found.");

    return NextResponse.json(vehicle);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return jsonError("A vehicle with this number already exists.", 409);
    }
    return serverError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid vehicle id.");

  try {
    await connectToDatabase();

    // Delivery rows reference the vehicle; a vehicle with history is disabled
    // (PATCH isActive:false), never hard-deleted.
    if (await SupplyLog.exists({ vehicle: id })) {
      return jsonError("This vehicle has delivery records. Disable it instead.", 409);
    }

    const deleted = await Vehicle.findByIdAndDelete(id).select("_id").lean();
    if (!deleted) return notFound("Vehicle not found.");

    // Remove deleted vehicle from default driver assignment.
    await User.updateMany(
      { assignedVehicle: id },
      { $set: { assignedVehicle: null } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
