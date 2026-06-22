import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(90, Math.max(7, Number.parseInt(daysParam ?? "30", 10) || 30));

  await connectToDatabase();

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const dateLabels: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dateLabels.push(`${year}-${month}-${day}`);
  }

  const [deliveryAgg, registrationAgg] = await Promise.all([
    SupplyLog.aggregate([
      { $match: { logType: "water", suppliedAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$suppliedAt", timezone: "+05:30" } },
          count: { $sum: 1 },
          totalCans: { $sum: { $ifNull: ["$cansDelivered", 0] } },
        },
      },
    ]),
    Customer.aggregate([
      { $match: { createdAt: { $gte: start } } },
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
}
