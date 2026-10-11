import { NextRequest, NextResponse } from "next/server";
import { badRequest, jsonError, readJsonObject, requiredString, serverError, unauthorized } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/authHelpers";
import { connectToDatabase } from "../../../../lib/mongodb";
import Vehicle from "../../../../models/Vehicle";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  try {
    await connectToDatabase();
    const vehicles = await Vehicle.find()
      .select("-odometerHistory")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(vehicles);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  // "Number" (registration) is stored in `name`; "Model" in `vehicleNumber`.
  const name = requiredString(body.name, 200);
  const vehicleNumber = requiredString(body.vehicleNumber, 100);
  const capacity = requiredString(body.capacity, 100);

  if (!name || !vehicleNumber || !capacity) {
    return badRequest("Number, model, and capacity are required.");
  }

  try {
    await connectToDatabase();

    // Two vehicles can share a model, but not a registration number.
    const existing = await Vehicle.exists({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } });
    if (existing) {
      return jsonError("A vehicle with this number already exists.", 409);
    }

    const vehicle = await Vehicle.create({ name, vehicleNumber, capacity });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return jsonError("A vehicle with this number already exists.", 409);
    }
    return serverError(err);
  }
}
