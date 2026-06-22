import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import Assignment from "../../../../models/Assignment";

// GET — list all assignments
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const assignments = await Assignment.find()
        .populate("supplyPoint", "name address tankerTypes")
        .populate("driver", "name username phone")
        .sort({ scheduledDate: -1 })
        .limit(100)
        .lean();

    return NextResponse.json(assignments);
}

// POST — create a new assignment
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { supplyPoint: string; driver: string; tankerType: string; scheduledDate: string; frequency?: string };
    const { supplyPoint, driver, tankerType, scheduledDate } = body;
    const frequency = body.frequency || "once";

    if (!supplyPoint || !driver || !tankerType || !scheduledDate) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectToDatabase();
    const assignment = await Assignment.create({ supplyPoint, driver, tankerType, scheduledDate, frequency });

    const populated = await Assignment.findById(assignment._id)
        .populate("supplyPoint", "name address tankerTypes")
        .populate("driver", "name username phone")
        .lean();

    return NextResponse.json(populated, { status: 201 });
}
