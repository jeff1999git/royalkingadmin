import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import Vehicle from "../../../../models/Vehicle";
import User from "../../../../models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const [vehicles, driver] = await Promise.all([
    Vehicle.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    User.findById(session.user.id).select("assignedVehicle").lean(),
  ]);

  return NextResponse.json({
    vehicles,
    assignedVehicleId: driver?.assignedVehicle
      ? String(driver.assignedVehicle)
      : null,
  });
}
