import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { connectToDatabase } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import Vehicle from "../../../../../models/Vehicle";

function canPopulateAssignedVehicle() {
    return Boolean(User.schema.path("assignedVehicle"));
}

// PATCH — update driver details / status / default vehicle
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
        return NextResponse.json({ error: "Invalid driver id." }, { status: 400 });
    }

    const body = await req.json() as {
        name?: string;
        username?: string;
        phone?: string;
        isActive?: boolean;
        assignedVehicleId?: string | null;
    };

    await connectToDatabase();
    const updates: {
        name?: string;
        username?: string;
        phone?: string;
        isActive?: boolean;
        assignedVehicle?: string | null;
    } = {};

    if (typeof body.name === "string") {
        const name = body.name.trim();
        if (!name) {
            return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
        }
        updates.name = name;
    }

    if (typeof body.username === "string") {
        const username = body.username.trim();
        if (!username) {
            return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
        }
        const existing = await User.findOne({
            username,
            _id: { $ne: id },
            role: "driver",
        }).lean();
        if (existing) {
            return NextResponse.json({ error: "Username already taken." }, { status: 409 });
        }
        updates.username = username;
    }

    if (typeof body.phone === "string") {
        const phone = body.phone.trim();
        if (!phone) {
            return NextResponse.json({ error: "Phone cannot be empty." }, { status: 400 });
        }
        updates.phone = phone;
    }

    if (typeof body.isActive === "boolean") {
        updates.isActive = body.isActive;
    }

    if (body.assignedVehicleId !== undefined) {
        const assignedVehicleId = body.assignedVehicleId?.trim() ?? "";
        if (!assignedVehicleId) {
            updates.assignedVehicle = null;
        } else {
            if (!Types.ObjectId.isValid(assignedVehicleId)) {
                return NextResponse.json({ error: "Invalid assigned vehicle." }, { status: 400 });
            }
            const vehicle = await Vehicle.findById(assignedVehicleId).lean();
            if (!vehicle || !vehicle.isActive) {
                return NextResponse.json({ error: "Assigned vehicle is not available." }, { status: 400 });
            }
            updates.assignedVehicle = assignedVehicleId;
        }
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const driverQuery = User.findByIdAndUpdate(
        id,
        updates,
        { new: true }
    ).select("-password");
    if (canPopulateAssignedVehicle()) {
        driverQuery.populate("assignedVehicle", "name vehicleNumber capacity isActive");
    }
    const driver = await driverQuery.lean();

    if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json(driver);
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
        return NextResponse.json({ error: "Invalid driver id." }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await User.findOneAndDelete({ _id: id, role: "driver" }).lean();
    if (!deleted) {
        return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
