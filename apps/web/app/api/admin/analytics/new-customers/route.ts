import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { newCustomerMatch, resolveAnalyticsRange } from "../../../../../lib/analyticsRange";
import { connectToDatabase } from "../../../../../lib/mongodb";
import Customer from "../../../../../models/Customer";
import User from "../../../../../models/User";

// Enough for any realistic period; the response says when it is cut short.
const MAX_CUSTOMERS = 500;

type AddedBy =
  | { kind: "admin" }
  | { kind: "driver"; name: string; username: string }
  | { kind: "deleted-driver" };

// GET — the customers counted as "New Customers" on the analytics page.
// Takes the same ?from&to or ?days params as /api/admin/analytics and uses
// the same window and match, so the list always adds up to that number.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = resolveAnalyticsRange(req.nextUrl.searchParams);
  if (!range) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }
  const match = newCustomerMatch(range);

  try {
    await connectToDatabase();

    const [total, customers] = await Promise.all([
      Customer.countDocuments(match),
      Customer.find(match)
        .select("name phone area address locationType subscriptionCans cashPerCan cashPerCase isActive isDeleted registeredDate createdAt createdBy")
        .sort({ createdAt: -1, _id: -1 })
        .limit(MAX_CUSTOMERS)
        .lean(),
    ]);

    // Who added each customer. Drivers set createdBy; the admin account isn't
    // stored in the users collection, so admin-added customers have none.
    const driverIds = [
      ...new Set(customers.flatMap((c) => (c.createdBy ? [String(c.createdBy)] : []))),
    ].filter((id) => Types.ObjectId.isValid(id));
    const drivers = driverIds.length
      ? await User.find({ _id: { $in: driverIds } }).select("name username").lean()
      : [];
    const driverById = new Map(drivers.map((d) => [String(d._id), d]));

    const list = customers.map(({ createdBy, ...customer }) => {
      let addedBy: AddedBy = { kind: "admin" };
      if (createdBy) {
        const driver = driverById.get(String(createdBy));
        addedBy = driver
          ? { kind: "driver", name: driver.name, username: driver.username }
          : { kind: "deleted-driver" };
      }
      return { ...customer, addedBy };
    });

    return NextResponse.json({
      fromDay: range.fromDay,
      toDay: range.toDay,
      total,
      limit: MAX_CUSTOMERS,
      customers: list,
    });
  } catch (err) {
    console.error("[analytics new-customers GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
