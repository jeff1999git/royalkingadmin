import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
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
    const target = dateParam ? new Date(dateParam) : new Date();
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    await connectToDatabase();

    const [drivers, vehicles, todayDeliveries, customers] = await Promise.all([
        User.countDocuments({ role: "driver", isActive: true }),
        Vehicle.countDocuments({ isActive: true }),
        SupplyLog.countDocuments({ logType: "water", suppliedAt: { $gte: start, $lte: end } }),
        Customer.countDocuments({ isActive: true }),
    ]);

    return NextResponse.json({ drivers, vehicles, todayDeliveries, customers });
}
