import { NextRequest, NextResponse } from "next/server";
import { badRequest, jsonError, optionalString, readJsonObject, requiredString, serverError, unauthorized } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/authHelpers";
import { connectToDatabase } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Vehicle from "../../../../models/Vehicle";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

// Logins are capped at this length (lib/auth.ts), so a longer password could never sign in.
const MAX_PASSWORD_LENGTH = 200;

// GET — list all drivers
export async function GET() {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    try {
        await connectToDatabase();
        const drivers = await User.find({ role: "driver" })
            .select("-password")
            .populate("assignedVehicle", "name vehicleNumber capacity isActive")
            .lean();
        return NextResponse.json(drivers);
    } catch (err) {
        return serverError(err);
    }
}

// POST — create a new driver
export async function POST(req: NextRequest) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    const body = await readJsonObject(req);
    if (!body) return badRequest("Invalid request body.");

    const name = requiredString(body.name, 200);
    const username = requiredString(body.username, 100);
    const phone = requiredString(body.phone, 30);
    const password = typeof body.password === "string" ? body.password : "";
    const assignedVehicleId = optionalString(body.assignedVehicleId, 100);

    if (!name || !username || !password || !phone) {
        return badRequest("All fields are required");
    }
    if (password.length < 6) {
        return badRequest("Password must be at least 6 characters.");
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return badRequest(`Password must be at most ${MAX_PASSWORD_LENGTH} characters.`);
    }

    try {
        await connectToDatabase();

        const existing = await User.exists({ username });
        if (existing) {
            return jsonError("Username already taken", 409);
        }

        let assignedVehicle: string | null = null;
        if (assignedVehicleId) {
            if (!Types.ObjectId.isValid(assignedVehicleId)) {
                return badRequest("Invalid assigned vehicle.");
            }
            const vehicle = await Vehicle.exists({ _id: assignedVehicleId, isActive: true });
            if (!vehicle) {
                return badRequest("Assigned vehicle is not available.");
            }
            assignedVehicle = assignedVehicleId;
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

        const driver = await User.findById(createdDriver._id)
            .select("-password")
            .populate("assignedVehicle", "name vehicleNumber capacity isActive")
            .lean();
        if (!driver) {
            return jsonError("Failed to load created driver", 500);
        }

        return NextResponse.json(driver, { status: 201 });
    } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
            return jsonError("Username already taken", 409);
        }
        return serverError(err);
    }
}
