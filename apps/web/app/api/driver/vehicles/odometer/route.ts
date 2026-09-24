import { NextRequest, NextResponse } from "next/server";
import { badRequest, optionalNumber, readJsonObject, serverError, unauthorized } from "../../../../../lib/api";
import { requireDriver } from "../../../../../lib/authHelpers";
import { istDayStart } from "../../../../../lib/istTime";
import { connectToDatabase } from "../../../../../lib/mongodb";
import Vehicle from "../../../../../models/Vehicle";
import User from "../../../../../models/User";

export const dynamic = "force-dynamic";

// The history sheet shows the latest few readings; the array itself grows by
// one entry per driver-day forever, so only the tail is ever loaded here.
const HISTORY_ENTRIES = 5;
const MAX_ODOMETER = 9_999_999;

export async function GET() {
  const session = await requireDriver();
  if (!session) return unauthorized();

  try {
    await connectToDatabase();

    const driver = await User.findById(session.id).select("assignedVehicle").lean();
    if (!driver?.assignedVehicle) {
      // No vehicle → no odometer to fill; hasVehicle:false tells the client
      // not to show the blocking daily prompt (which could never be satisfied).
      return NextResponse.json({ hasVehicle: false, filledToday: false, odometer: null, history: [] });
    }

    const vehicle = await Vehicle.findById(driver.assignedVehicle)
      .select({ odometer: 1, odometerLastUpdated: 1, odometerHistory: { $slice: -HISTORY_ENTRIES } })
      .lean();

    if (!vehicle) {
      return NextResponse.json({ hasVehicle: false, filledToday: false, odometer: null, history: [] });
    }

    const lastUpdated = vehicle.odometerLastUpdated;
    const filledToday = Boolean(lastUpdated && new Date(lastUpdated) >= istDayStart());

    // Entries are pushed chronologically, so the tail is the newest; sort the
    // handful anyway so the response is newest first whatever the order on disk.
    const history = [...(vehicle.odometerHistory ?? [])]
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      .map((e) => ({ reading: e.reading, recordedAt: e.recordedAt }));

    return NextResponse.json({ hasVehicle: true, filledToday, odometer: vehicle.odometer ?? 0, history });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireDriver();
  if (!session) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  const odometer = optionalNumber(body.odometer);
  if (odometer === undefined || !Number.isInteger(odometer) || odometer < 0 || odometer > MAX_ODOMETER) {
    return badRequest("Invalid odometer value.");
  }

  try {
    await connectToDatabase();

    const driver = await User.findById(session.id).select("assignedVehicle").lean();
    if (!driver?.assignedVehicle) {
      return badRequest("No vehicle assigned to you.");
    }

    const now = new Date();

    // One atomic, conditional write: the daily gate is part of the filter, so
    // two overlapping submits cannot both pass it and record the day twice.
    // Vehicles that never had a reading have no odometerLastUpdated at all.
    const updated = await Vehicle.findOneAndUpdate(
      {
        _id: driver.assignedVehicle,
        $or: [
          { odometerLastUpdated: { $exists: false } },
          { odometerLastUpdated: null },
          { odometerLastUpdated: { $lt: istDayStart() } },
        ],
      },
      {
        $set: { odometer, odometerLastUpdated: now },
        $push: {
          odometerHistory: {
            reading: odometer,
            recordedAt: now,
            driverId: driver._id,
          },
        },
      },
      { returnDocument: "after", projection: { _id: 1 } }
    ).lean();

    if (!updated) {
      return badRequest("Odometer already submitted for today.");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
