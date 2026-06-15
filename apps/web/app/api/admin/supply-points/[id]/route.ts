import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { connectToDatabase } from "../../../../../lib/mongodb";
import WaterSupplyPoint from "../../../../../models/WaterSupplyPoint";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as { name: string; address: string; tankerTypes: string[] };
    const { name, address, tankerTypes } = body;

    if (!name || !address || !Array.isArray(tankerTypes) || tankerTypes.length === 0) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await WaterSupplyPoint.findByIdAndUpdate(
        id,
        { name, address, tankerTypes },
        { new: true }
    ).lean();

    if (!updated) {
        return NextResponse.json({ error: "Supply point not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
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
        return NextResponse.json({ error: "Invalid supply point id." }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await WaterSupplyPoint.findByIdAndDelete(id);

    if (!deleted) {
        return NextResponse.json({ error: "Supply point not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
