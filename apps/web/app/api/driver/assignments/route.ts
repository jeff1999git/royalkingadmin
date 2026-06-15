import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import Assignment from "../../../../models/Assignment";

// GET — driver's own assignments
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "driver") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const assignments = await Assignment.find({ driver: session.user.id })
        .populate("supplyPoint", "name address tankerTypes")
        .sort({ scheduledDate: -1 })
        .lean();

    return NextResponse.json(assignments);
}
