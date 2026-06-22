import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Vehicle from "../../../../models/Vehicle";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

function canPopulateAssignedVehicle() {
    return Boolean(User.schema.path("assignedVehicle"));
}

// GET — list all drivers
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const driversQuery = User.find({ role: "driver" }).select("-password");
    if (canPopulateAssignedVehicle()) {
        driversQuery.populate("assignedVehicle", "name vehicleNumber capacity isActive");
    }
    const drivers = await driversQuery.lean();
    return NextResponse.json(drivers);
}

// POST — create a new driver
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
        name: string;
        username: string;
        password: string;
        phone: string;
        assignedVehicleId?: string;
    };
    const { name, username, password, phone, assignedVehicleId } = body;

    if (!name || !username || !password || !phone) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ username }).lean();
    if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    let assignedVehicle: string | null = null;
    if (assignedVehicleId && assignedVehicleId.trim()) {
        const normalizedVehicleId = assignedVehicleId.trim();
        if (!Types.ObjectId.isValid(normalizedVehicleId)) {
            return NextResponse.json({ error: "Invalid assigned vehicle." }, { status: 400 });
        }
        const vehicle = await Vehicle.findById(normalizedVehicleId).lean();
        if (!vehicle || !vehicle.isActive) {
            return NextResponse.json({ error: "Assigned vehicle is not available." }, { status: 400 });
        }
        assignedVehicle = normalizedVehicleId;
    }

    const hashed = await bcrypt.hash(password, 12);
    const createdDriver = await User.create({
        name,
        username,
        password: hashed,
        phone,
        role: "driver",
        assignedVehicle,
    });
    if (!createdDriver) {
        return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
    }

    const driverQuery = User.findById(createdDriver._id).select("-password");
    if (canPopulateAssignedVehicle()) {
        driverQuery.populate("assignedVehicle", "name vehicleNumber capacity isActive");
    }
    const driver = await driverQuery.lean();
    if (!driver) {
        return NextResponse.json({ error: "Failed to load created driver" }, { status: 500 });
    }

    return NextResponse.json(driver, { status: 201 });
}
