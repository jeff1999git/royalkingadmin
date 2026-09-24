import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/authHelpers";
import { newCustomerMatch, resolveAnalyticsRange } from "../../../../lib/analyticsRange";
import { connectToDatabase } from "../../../../lib/mongodb";
import { SUM_CASES } from "../../../../lib/supplyProduct";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const driverIdParam = sp.get("driverId");
  const vehicleIdParam = sp.get("vehicleId");
  // A bad or stale id must not silently show company-wide numbers under a name.
  if (driverIdParam && !Types.ObjectId.isValid(driverIdParam)) {
    return badRequest("Invalid driver id.");
  }
  if (vehicleIdParam && !Types.ObjectId.isValid(vehicleIdParam)) {
    return badRequest("Invalid vehicle id.");
  }

  // Inclusive IST days. Shared with /api/admin/analytics/new-customers so the
  // "New Customers" total and the list behind it use the same window.
  const range = resolveAnalyticsRange(sp);
  if (!range) return badRequest("Invalid date range.");
  const { fromDay, toDay, start, end } = range;

  try {
  await connectToDatabase();

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
  if (driverIdParam) {
    deliveryMatch.driver = new Types.ObjectId(driverIdParam);
  }
  if (vehicleIdParam) {
    deliveryMatch.vehicle = new Types.ObjectId(vehicleIdParam);
  }

  const registrationMatch: MatchType = newCustomerMatch(range);

  const [deliveryAgg, registrationAgg] = await Promise.all([
    SupplyLog.aggregate([
      { $match: deliveryMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$suppliedAt", timezone: "+05:30" } },
          count: { $sum: 1 },
          totalCans: { $sum: { $ifNull: ["$cansDelivered", 0] } },
          totalCases: SUM_CASES,
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

  type DeliveryBucket = { _id: string; count: number; totalCans: number; totalCases: number };
  type RegBucket = { _id: string; count: number };

  const deliveryMap = new Map<string, { count: number; totalCans: number; totalCases: number }>(
    (deliveryAgg as DeliveryBucket[]).map((d) => [d._id, { count: d.count, totalCans: d.totalCans, totalCases: d.totalCases }])
  );
  const registrationMap = new Map<string, number>(
    (registrationAgg as RegBucket[]).map((r) => [r._id, r.count])
  );

  const deliveries = dateLabels.map((date) => ({
    date,
    count: deliveryMap.get(date)?.count ?? 0,
    totalCans: deliveryMap.get(date)?.totalCans ?? 0,
    totalCases: deliveryMap.get(date)?.totalCases ?? 0,
  }));

  const registrations = dateLabels.map((date) => ({
    date,
    count: registrationMap.get(date) ?? 0,
  }));

  return NextResponse.json({ deliveries, registrations });
  } catch (err) {
    return serverError(err);
  }
}
