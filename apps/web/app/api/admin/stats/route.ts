import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { istDateRange, istDayEnd, istDayStart } from "../../../../lib/istTime";
import { connectToDatabase } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Vehicle from "../../../../models/Vehicle";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateParam = req.nextUrl.searchParams.get("date");
    let start: Date;
    let end: Date;
    if (dateParam) {
        const range = istDateRange(dateParam);
        if (!range) {
            return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
        }
        start = range.start;
        end = range.end;
    } else {
        start = istDayStart();
        end = istDayEnd();
    }

    await connectToDatabase();

    const [drivers, vehicles, todayDeliveries, customers] = await Promise.all([
        User.countDocuments({ role: "driver", isActive: true }),
        Vehicle.countDocuments({ isActive: true }),
        SupplyLog.countDocuments({ logType: "water", suppliedAt: { $gte: start, $lte: end } }),
        Customer.countDocuments({ isActive: true }),
    ]);

    return NextResponse.json({ drivers, vehicles, todayDeliveries, customers });
}
