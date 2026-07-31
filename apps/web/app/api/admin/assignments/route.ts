import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
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
    if (!Types.ObjectId.isValid(supplyPoint) || !Types.ObjectId.isValid(driver)) {
        return NextResponse.json({ error: "Invalid supply point or driver." }, { status: 400 });
    }
    const parsedDate = new Date(scheduledDate);
    if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Invalid scheduled date." }, { status: 400 });
    }
    if (frequency !== "once" && frequency !== "daily") {
        return NextResponse.json({ error: "Invalid frequency." }, { status: 400 });
    }

    await connectToDatabase();
    const assignment = await Assignment.create({ supplyPoint, driver, tankerType, scheduledDate: parsedDate, frequency });

    // Populate in place instead of re-fetching the document
    await assignment.populate([
        { path: "supplyPoint", select: "name address tankerTypes" },
        { path: "driver", select: "name username phone" },
    ]);

    return NextResponse.json(assignment.toObject(), { status: 201 });
}
