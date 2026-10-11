import { NextResponse } from "next/server";
import { serverError, unauthorized } from "../../../../lib/api";
import { requireDriver } from "../../../../lib/authHelpers";
import { connectToDatabase } from "../../../../lib/mongodb";
import Vehicle from "../../../../models/Vehicle";
import User from "../../../../models/User";

export async function GET() {
  const driver = await requireDriver();
  if (!driver) return unauthorized();

  try {
    await connectToDatabase();
    const [vehicles, user] = await Promise.all([
      Vehicle.find({ isActive: true })
        .select("name vehicleNumber capacity")
        .sort({ createdAt: -1 })
        .lean(),
      User.findById(driver.id).select("assignedVehicle").lean(),
    ]);

    return NextResponse.json({
      vehicles,
      assignedVehicleId: user?.assignedVehicle
        ? String(user.assignedVehicle)
        : null,
    });
  } catch (err) {
    return serverError(err);
  }
}
