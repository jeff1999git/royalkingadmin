import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import WaterSupplyPoint from "../../../../models/WaterSupplyPoint";

// GET — list all supply points
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const points = await WaterSupplyPoint.find().lean();
    return NextResponse.json(points);
}

// POST — create a supply point
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "driver") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { name: string; address: string; tankerTypes: string[] };
    const { name, address, tankerTypes } = body;

    if (!name || !address || !Array.isArray(tankerTypes) || tankerTypes.length === 0) {
        return NextResponse.json({ error: "All fields are required, including at least one tanker type" }, { status: 400 });
    }

    try {
        await connectToDatabase();
        const point = await WaterSupplyPoint.create({ name, address, tankerTypes });
        return NextResponse.json(point, { status: 201 });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Database error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
