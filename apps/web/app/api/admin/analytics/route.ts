import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { istDateRange, istTodayString } from "../../../../lib/istTime";
import { connectToDatabase } from "../../../../lib/mongodb";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";
import { Types } from "mongoose";

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

  // Both branches work in IST days: fromDay/toDay are inclusive IST date
  // strings, and the query range spans exactly those days.
  let fromDay: string;
  let toDay: string;

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (fromParam && toParam && dateRe.test(fromParam) && dateRe.test(toParam) && fromParam <= toParam) {
    fromDay = fromParam;
    toDay = toParam;
  } else {
    const days = Math.min(90, Math.max(7, Number.parseInt(daysParam ?? "30", 10) || 30));
    toDay = istTodayString();
    const first = new Date(`${toDay}T00:00:00.000Z`);
    first.setUTCDate(first.getUTCDate() - days + 1);
    fromDay = first.toISOString().slice(0, 10);
  }

  const start = istDateRange(fromDay)!.start;
  const end = istDateRange(toDay)!.end;

  // Enumerate IST date labels from fromDay to toDay inclusive
  const dateLabels: string[] = [];
  const cur = new Date(`${fromDay}T00:00:00.000Z`);
  const last = new Date(`${toDay}T00:00:00.000Z`);
  while (cur <= last) {
    dateLabels.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
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
