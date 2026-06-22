import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";
import { Types } from "mongoose";

// YYYY-MM-DD (IST date string) → UTC Date at IST midnight of that day
function istMidnightUTC(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setMinutes(d.getMinutes() - 330); // subtract IST offset (5h30m)
  return d;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const fromParam = sp.get("from");
  const toParam = sp.get("to");
  const daysParam = sp.get("days");
  const driverIdParam = sp.get("driverId");
  const vehicleIdParam = sp.get("vehicleId");

  try {
  await connectToDatabase();

  let start: Date;
  let end: Date;
  const dateLabels: string[] = [];

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (fromParam && toParam && dateRe.test(fromParam) && dateRe.test(toParam) && fromParam <= toParam) {
    start = istMidnightUTC(fromParam);
    // end = start of next IST day after toParam (exclusive upper bound)
    const nextDay = new Date(toParam + "T00:00:00.000Z");
    nextDay.setDate(nextDay.getDate() + 1);
    end = istMidnightUTC(nextDay.toISOString().slice(0, 10));

    // Enumerate IST date labels from fromParam to toParam inclusive
    const cur = new Date(fromParam + "T00:00:00.000Z");
    const last = new Date(toParam + "T00:00:00.000Z");
    while (cur <= last) {
      dateLabels.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const days = Math.min(90, Math.max(7, Number.parseInt(daysParam ?? "30", 10) || 30));
    const now = new Date();
    start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dateLabels.push(`${year}-${month}-${day}`);
    }
  }

  type MatchType = Record<string, unknown>;

  const deliveryMatch: MatchType = {
    logType: "water",
    suppliedAt: { $gte: start, $lte: end },
  };
  if (driverIdParam && Types.ObjectId.isValid(driverIdParam)) {
    deliveryMatch.driver = new Types.ObjectId(driverIdParam);
  }
  if (vehicleIdParam && Types.ObjectId.isValid(vehicleIdParam)) {
    deliveryMatch.vehicle = new Types.ObjectId(vehicleIdParam);
  }

  const registrationMatch: MatchType = { createdAt: { $gte: start, $lte: end } };

  const [deliveryAgg, registrationAgg] = await Promise.all([
    SupplyLog.aggregate([
      { $match: deliveryMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$suppliedAt", timezone: "+05:30" } },
          count: { $sum: 1 },
          totalCans: { $sum: { $ifNull: ["$cansDelivered", 0] } },
        },
      },
    ]),
    Customer.aggregate([
      { $match: registrationMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  type DeliveryBucket = { _id: string; count: number; totalCans: number };
  type RegBucket = { _id: string; count: number };

  const deliveryMap = new Map<string, { count: number; totalCans: number }>(
    (deliveryAgg as DeliveryBucket[]).map((d) => [d._id, { count: d.count, totalCans: d.totalCans }])
  );
  const registrationMap = new Map<string, number>(
    (registrationAgg as RegBucket[]).map((r) => [r._id, r.count])
  );

  const deliveries = dateLabels.map((date) => ({
    date,
    count: deliveryMap.get(date)?.count ?? 0,
    totalCans: deliveryMap.get(date)?.totalCans ?? 0,
  }));

  const registrations = dateLabels.map((date) => ({
    date,
    count: registrationMap.get(date) ?? 0,
  }));

  return NextResponse.json({ deliveries, registrations });
  } catch (err) {
    console.error("[analytics GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
