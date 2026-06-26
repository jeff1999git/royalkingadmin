import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { connectToDatabase } from "../../../../../lib/mongodb";
import Vehicle from "../../../../../models/Vehicle";
import User from "../../../../../models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const driver = await User.findById(session.user.id).select("assignedVehicle").lean();
  if (!driver?.assignedVehicle) {
    return NextResponse.json({ filledToday: false, odometer: null, history: [] });
  }

  const vehicle = await Vehicle.findById(driver.assignedVehicle)
    .select("odometer odometerLastUpdated odometerHistory")
    .lean();

  if (!vehicle) {
    return NextResponse.json({ filledToday: false, odometer: null, history: [] });
  }

  const lastUpdated = vehicle.odometerLastUpdated;
  let filledToday = false;
  if (lastUpdated) {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    filledToday = new Date(lastUpdated) >= startOfToday;
  }

  const history = [...(vehicle.odometerHistory ?? [])]
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 5)
    .map((e) => ({ reading: e.reading, recordedAt: e.recordedAt }));

  return NextResponse.json({ filledToday, odometer: vehicle.odometer ?? 0, history });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { odometer?: unknown } = {};
  try {
    body = (await req.json()) as { odometer?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const odometer = Number(body.odometer);
  if (!Number.isFinite(odometer) || odometer < 0) {
    return NextResponse.json({ error: "Invalid odometer value." }, { status: 400 });
  }

  await connectToDatabase();

  const driver = await User.findById(session.user.id).select("assignedVehicle").lean();
  if (!driver?.assignedVehicle) {
    return NextResponse.json({ error: "No vehicle assigned to you." }, { status: 400 });
  }

  const vehicle = await Vehicle.findById(driver.assignedVehicle)
    .select("odometerLastUpdated")
    .lean();

  if (vehicle?.odometerLastUpdated) {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    if (new Date(vehicle.odometerLastUpdated) >= startOfToday) {
      return NextResponse.json({ error: "Odometer already submitted for today." }, { status: 400 });
    }
  }

  const now = new Date();

  // Critical: save odometer + timestamp first — this controls the daily gate
  await Vehicle.findByIdAndUpdate(driver.assignedVehicle, {
    $set: { odometer, odometerLastUpdated: now },
  });

  // Non-critical: append to history separately so it never blocks the save above
  try {
    await Vehicle.findByIdAndUpdate(driver.assignedVehicle, {
      $push: {
        odometerHistory: {
          reading: odometer,
          recordedAt: now,
          driverId: driver._id,
        },
      },
    });
  } catch {
    // history push failed — odometer timestamp already saved, gate will work
  }

  return NextResponse.json({ success: true });
}
