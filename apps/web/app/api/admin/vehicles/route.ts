import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import Vehicle from "../../../../models/Vehicle";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    vehicleNumber?: string;
    capacity?: string;
  };

  const name = body.name?.trim();
  const vehicleNumber = body.vehicleNumber?.trim().toUpperCase();
  const capacity = body.capacity?.trim();

  if (!name || !vehicleNumber || !capacity) {
    return NextResponse.json(
      { error: "Name, vehicle number, and capacity are required." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const existing = await Vehicle.findOne({ vehicleNumber }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "Vehicle number already exists." },
      { status: 409 }
    );
  }

  const vehicle = await Vehicle.create({ name, vehicleNumber, capacity });
  return NextResponse.json(vehicle, { status: 201 });
}
