import { NextRequest, NextResponse } from "next/server";
import { badRequest, jsonError, optionalNumber, readJsonObject, requiredString, serverError, unauthorized } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/authHelpers";
import { createOrRestoreCustomer } from "../../../../lib/customers";
import { connectToDatabase } from "../../../../lib/mongodb";
import Customer from "../../../../models/Customer";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
  const area = req.nextUrl.searchParams.get("area")?.trim() ?? "";
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");

  const baseQuery: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    baseQuery.$or = [{ name: regex }, { phone: regex }, { email: regex }, { area: regex }];
  }
  if (area) baseQuery.area = area;

  try {
    await connectToDatabase();

    if (!pageParam && !limitParam) {
      // No pagination params — trimmed array for dropdowns
      const customers = await Customer.find(baseQuery)
        .select("name phone area isActive locationType subscriptionCans cashPerCan")
        .sort({ isActive: -1, name: 1 })
        .lean();
      return NextResponse.json(customers);
    }

    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
    const limit = Math.max(1, Math.min(100, Number.parseInt(limitParam ?? "30", 10) || 30));
    const skip = (page - 1) * limit;

    const [customers, aggResult, areas] = await Promise.all([
      Customer.find(baseQuery).sort({ isActive: -1, name: 1 }).skip(skip).limit(limit).lean(),
      Customer.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: "$isActive",
            count: { $sum: 1 },
          },
        },
      ]),
      Customer.distinct("area", { isDeleted: { $ne: true } }),
    ]);

    const activeCount = (aggResult.find((r: { _id: boolean; count: number }) => r._id === true)?.count ?? 0) as number;
    const inactiveCount = (aggResult.find((r: { _id: boolean; count: number }) => r._id === false)?.count ?? 0) as number;
    const total = activeCount + inactiveCount;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const sortedAreas = (areas as string[]).filter(Boolean).sort();

    return NextResponse.json({ customers, total, activeCount, inactiveCount, page, limit, totalPages, areas: sortedAreas });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  const name = requiredString(body.name, 200);
  const phone = requiredString(body.phone, 30);
  const email = requiredString(body.email, 200);
  const address = requiredString(body.address, 1000);
  const area = requiredString(body.area, 200);
  const locationType = body.locationType === "home" || body.locationType === "office" || body.locationType === "both"
    ? body.locationType
    : undefined;
  const subscriptionCans = body.subscriptionCans === undefined ? 1 : optionalNumber(body.subscriptionCans);
  const cashPerCan = optionalNumber(body.cashPerCan);
  const securityDeposit = optionalNumber(body.securityDeposit);
  const registeredDate = body.registeredDate
    ? new Date(typeof body.registeredDate === "string" ? body.registeredDate : NaN)
    : new Date();

  if (!name) return badRequest("Name is required.");
  if (!phone) return badRequest("Phone is required.");
  if (!address) return badRequest("Location is required.");
  if (subscriptionCans === undefined || !Number.isInteger(subscriptionCans) || subscriptionCans < 1) {
    return badRequest("Subscription cans must be a positive integer.");
  }
  const hasCashPerCan = body.cashPerCan !== undefined && body.cashPerCan !== null && body.cashPerCan !== "";
  if (hasCashPerCan && (cashPerCan === undefined || cashPerCan < 0)) {
    return badRequest("Cash per can must be a non-negative number.");
  }
  const hasSecurityDeposit = body.securityDeposit !== undefined && body.securityDeposit !== null && body.securityDeposit !== "";
  if (hasSecurityDeposit && (securityDeposit === undefined || securityDeposit < 0)) {
    return badRequest("Security deposit must be a non-negative number.");
  }
  if (body.locationType && locationType === undefined) {
    return badRequest("Location type must be home, office, or both.");
  }
  if (Number.isNaN(registeredDate.getTime())) return badRequest("Invalid date.");

  try {
    await connectToDatabase();
    const result = await createOrRestoreCustomer({
      name,
      phone,
      email,
      address,
      area,
      locationType,
      subscriptionCans,
      cashPerCan,
      securityDeposit,
      registeredDate,
      createdBy: admin.id,
    });
    if ("duplicate" in result) {
      return jsonError("A customer with this phone number already exists.", 409);
    }
    return NextResponse.json(result.customer, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
