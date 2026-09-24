import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { badRequest, jsonError, notFound, readJsonObject, serverError, unauthorized } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/authHelpers";
import { connectToDatabase } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import Vehicle from "../../../../../models/Vehicle";
import SupplyLog from "../../../../../models/SupplyLog";

// PATCH — update driver details / status / default vehicle
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return badRequest("Invalid driver id.");

    const body = await readJsonObject(req);
    if (!body) return badRequest("Invalid request body.");

    const updates: {
        name?: string;
        username?: string;
        phone?: string;
        isActive?: boolean;
        assignedVehicle?: string | null;
    } = {};

    if (typeof body.name === "string") {
        const name = body.name.trim();
        if (!name) return badRequest("Name cannot be empty.");
        updates.name = name;
    }

    let username: string | undefined;
    if (typeof body.username === "string") {
        username = body.username.trim();
        if (!username) return badRequest("Username cannot be empty.");
    }

    if (typeof body.phone === "string") {
        const phone = body.phone.trim();
        if (!phone) return badRequest("Phone cannot be empty.");
        updates.phone = phone;
    }

    if (typeof body.isActive === "boolean") {
        updates.isActive = body.isActive;
    }

    let assignedVehicleId: string | undefined;
    if (body.assignedVehicleId !== undefined) {
        if (body.assignedVehicleId !== null && typeof body.assignedVehicleId !== "string") {
            return badRequest("Invalid assigned vehicle.");
        }
        assignedVehicleId = body.assignedVehicleId?.trim() ?? "";
        if (!assignedVehicleId) {
            updates.assignedVehicle = null;
        } else if (!Types.ObjectId.isValid(assignedVehicleId)) {
            return badRequest("Invalid assigned vehicle.");
        }
    }

    try {
        await connectToDatabase();

        if (username !== undefined) {
            const existing = await User.exists({
                username,
                _id: { $ne: id },
                role: "driver",
            });
            if (existing) return jsonError("Username already taken.", 409);
            updates.username = username;
        }

        if (assignedVehicleId) {
            const vehicle = await Vehicle.exists({ _id: assignedVehicleId, isActive: true });
            if (!vehicle) return badRequest("Assigned vehicle is not available.");
            updates.assignedVehicle = assignedVehicleId;
        }

        if (Object.keys(updates).length === 0) {
            return badRequest("No valid fields to update.");
        }

        const driver = await User.findByIdAndUpdate(
            id,
            updates,
            { returnDocument: "after" }
        )
            .select("-password")
            .populate("assignedVehicle", "name vehicleNumber capacity isActive")
            .lean();

        if (!driver) return notFound("Driver not found");

        return NextResponse.json(driver);
    } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
            return jsonError("Username already taken.", 409);
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
    if (!Types.ObjectId.isValid(id)) return badRequest("Invalid driver id.");

    try {
        await connectToDatabase();

        // The ledger keeps its driver attribution: a driver with history is
        // deactivated (PATCH isActive:false), never hard-deleted.
        if (await SupplyLog.exists({ driver: id })) {
            return jsonError("This driver has delivery records. Deactivate the driver instead.", 409);
        }

        const deleted = await User.findOneAndDelete({ _id: id, role: "driver" }).select("_id").lean();
        if (!deleted) return notFound("Driver not found.");

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError(err);
    }
}
