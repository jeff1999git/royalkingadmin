import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { connectToDatabase } from "../../../../../../lib/mongodb";
import Assignment from "../../../../../../models/Assignment";

// PATCH — mark assignment as complete
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "driver") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as { remark?: string };

    await connectToDatabase();

    // Verify the assignment belongs to this driver
    const assignment = await Assignment.findOne({
        _id: id,
        driver: session.user.id,
    });

    if (!assignment) {
        return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.status === "completed") {
        return NextResponse.json({ error: "Already completed" }, { status: 409 });
    }

    assignment.status = "completed";
    assignment.completedAt = new Date();
    if (body.remark) {
        assignment.remark = body.remark;
    }
    await assignment.save();

    // Auto-renew if this is a daily trip
    if (assignment.frequency === "daily") {
        const nextDate = new Date(assignment.scheduledDate);
        nextDate.setDate(nextDate.getDate() + 1);

        await Assignment.create({
            supplyPoint: assignment.supplyPoint,
            driver: assignment.driver,
            tankerType: assignment.tankerType,
            frequency: "daily",
            scheduledDate: nextDate,
            status: "pending"
        });
    }

    const updated = await Assignment.findById(id)
        .populate("supplyPoint", "name address tankerTypes")
        .lean();

    return NextResponse.json(updated);
}
