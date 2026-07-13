import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";

function parseDateRange(dateText: string | null) {
  const target = dateText ? new Date(dateText) : new Date();
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseMonthRange(monthText: string | null) {
  if (!monthText) return null;
  const parts = monthText.split("-");
  if (parts.length !== 2) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const monthParam = req.nextUrl.searchParams.get("month");
  const daysParam = req.nextUrl.searchParams.get("days");
  const driverParam = req.nextUrl.searchParams.get("driver");
  const vehicleParam = req.nextUrl.searchParams.get("vehicle");
  const customerParam = req.nextUrl.searchParams.get("customer");
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const amountStatusParam = req.nextUrl.searchParams.get("amountStatus");
  const logTypeParam = req.nextUrl.searchParams.get("logType");
  const paymentStatusParam = req.nextUrl.searchParams.get("paymentStatus");

  const query: {
    suppliedAt?: { $gte?: Date; $lte?: Date; $lt?: Date };
    driver?: string;
    vehicle?: string;
    customer?: string;
    amount?: { $exists?: boolean; $ne?: null };
    logType?: "water" | "cash";
    paymentStatus?: "upi" | "not_paid" | { $nin: string[] };
  } = {};

  if (dateParam) {
    const dateRange = parseDateRange(dateParam);
    if (!dateRange) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }
    query.suppliedAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  if (monthParam) {
    const monthRange = parseMonthRange(monthParam);
    if (!monthRange) {
      return NextResponse.json({ error: "Invalid month format." }, { status: 400 });
    }
    query.suppliedAt = { $gte: monthRange.start, $lte: monthRange.end };
  }

  // Rolling recent window (e.g. days=5 → today plus previous 4 days). Page 1
  // serves the whole window; later pages walk records older than the window.
  // Explicit date/month filters win over the window.
  let windowStart: Date | null = null;
  if (daysParam && !dateParam && !monthParam) {
    const days = Number.parseInt(daysParam, 10);
    if (!Number.isInteger(days) || days < 1 || days > 366) {
      return NextResponse.json({ error: "Invalid days value." }, { status: 400 });
    }
    windowStart = new Date();
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - (days - 1));
  }

  if (driverParam) {
    if (!Types.ObjectId.isValid(driverParam)) {
      return NextResponse.json({ error: "Invalid driver id." }, { status: 400 });
    }
    query.driver = driverParam;
  }

  if (vehicleParam) {
    if (!Types.ObjectId.isValid(vehicleParam)) {
      return NextResponse.json({ error: "Invalid vehicle id." }, { status: 400 });
    }
    query.vehicle = vehicleParam;
  }

  if (customerParam) {
    if (!Types.ObjectId.isValid(customerParam)) {
      return NextResponse.json({ error: "Invalid customer id." }, { status: 400 });
    }
    query.customer = customerParam;
  }

  if (amountStatusParam === "pending") {
    query.amount = { $exists: false };
  } else if (amountStatusParam === "added") {
    query.amount = { $exists: true, $ne: null };
  } else if (amountStatusParam && amountStatusParam !== "all") {
    return NextResponse.json({ error: "Invalid amountStatus value." }, { status: 400 });
  }

  if (logTypeParam === "water" || logTypeParam === "cash") {
    query.logType = logTypeParam;
  } else if (logTypeParam) {
    return NextResponse.json({ error: "Invalid logType value." }, { status: 400 });
  }

  if (paymentStatusParam === "cash") {
    // Include records explicitly marked "cash" AND old records with no field set
    query.paymentStatus = { $nin: ["upi", "not_paid"] };
  } else if (paymentStatusParam === "upi" || paymentStatusParam === "not_paid") {
    query.paymentStatus = paymentStatusParam;
  } else if (paymentStatusParam && paymentStatusParam !== "") {
    return NextResponse.json({ error: "Invalid paymentStatus value." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    void Customer; // ensure model is registered for populate
    const hasPagination = Boolean(pageParam || limitParam);
    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
    const limit = Math.max(1, Math.min(200, Number.parseInt(limitParam ?? "10", 10) || 10));

    if (windowStart) {
      if (!hasPagination || page === 1) {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        query.suppliedAt = { $gte: windowStart, $lte: end };
      } else {
        query.suppliedAt = { $lt: windowStart };
      }
    }

    // Window mode: page 1 holds the entire recent window, pages 2+ step
    // through older records limit at a time.
    const skip = windowStart ? (page <= 1 ? 0 : (page - 2) * limit) : (page - 1) * limit;
    const fetchLimit = windowStart && page === 1 ? 500 : limit;

    const findQuery = SupplyLog.find(query)
      .populate("driver", "name username phone")
      .populate("vehicle", "name vehicleNumber capacity")
      .populate("customer", "name phone area")
      .sort({ suppliedAt: -1 });

    if (!hasPagination) {
      const logs = await findQuery.lean();
      return NextResponse.json(logs);
    }

    // In window mode we also need the count on the other side of the window:
    // on page 1 the older-records count (to size totalPages), on later pages
    // the window count (to keep serial numbers continuous).
    const extraCountPromise = windowStart
      ? SupplyLog.countDocuments({
          ...query,
          suppliedAt: page === 1 ? { $lt: windowStart } : { $gte: windowStart },
        })
      : Promise.resolve(0);

    const [logs, aggResult, extraCount] = await Promise.all([
      findQuery.skip(skip).limit(fetchLimit).lean(),
      SupplyLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalCans: { $sum: { $ifNull: ["$cansDelivered", 0] } },
            totalCansTakenBack: { $sum: { $ifNull: ["$cansTakenBack", 0] } },
            totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
            driverIds: { $addToSet: "$driver" },
            customerIds: { $addToSet: "$customer" },
          },
        },
      ]),
      extraCountPromise,
    ]);

    const agg = aggResult[0] as { count: number; totalCans: number; totalCansTakenBack: number; totalAmount: number; driverIds: unknown[]; customerIds: unknown[] } | undefined;
    const total = agg?.count ?? 0;
    let totalPages: number;
    let serialStart: number;
    if (!windowStart) {
      totalPages = Math.max(1, Math.ceil(total / limit));
      serialStart = skip;
    } else if (page === 1) {
      totalPages = 1 + Math.ceil(extraCount / limit);
      serialStart = 0;
    } else {
      totalPages = 1 + Math.ceil(total / limit);
      serialStart = extraCount + skip;
    }
    const stats = {
      totalCans: agg?.totalCans ?? 0,
      totalCansTakenBack: agg?.totalCansTakenBack ?? 0,
      totalAmount: agg?.totalAmount ?? 0,
      uniqueDrivers: agg?.driverIds?.length ?? 0,
      uniqueCustomers: agg?.customerIds?.length ?? 0,
    };

    return NextResponse.json({ logs, total, page, limit, totalPages, serialStart, stats });
  } catch (err) {
    console.error("[supplies GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    driverId?: string;
    customerId?: string;
    logType?: "water" | "cash";
    cansDelivered?: number | string;
    cansTakenBack?: number | string;
    amount?: number | string;
    cashType?: "debit" | "fuel";
    vehicleId?: string;
    notes?: string;
    suppliedAt?: string;
  };

  const logType = body.logType === "cash" ? "cash" : "water";
  const driverId = body.driverId?.trim();
  const customerId = body.customerId?.trim();
  const vehicleId = body.vehicleId?.trim();
  const notes = body.notes?.trim() || undefined;

  const suppliedAt = body.suppliedAt ? new Date(body.suppliedAt) : new Date();
  if (isNaN(suppliedAt.getTime())) {
    return NextResponse.json({ error: "Invalid delivery date." }, { status: 400 });
  }

  if (!driverId || !Types.ObjectId.isValid(driverId)) {
    return NextResponse.json({ error: "Valid driver is required." }, { status: 400 });
  }

  const cansDelivered =
    body.cansDelivered !== undefined && body.cansDelivered !== ""
      ? Number(body.cansDelivered)
      : undefined;
  const cansTakenBack =
    body.cansTakenBack !== undefined && body.cansTakenBack !== ""
      ? Number(body.cansTakenBack)
      : undefined;
  const amountValue =
    body.amount !== undefined && body.amount !== ""
      ? Number(body.amount)
      : undefined;

  if (logType === "water") {
    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Valid customer is required." }, { status: 400 });
    }
    if (cansDelivered === undefined && cansTakenBack === undefined) {
      return NextResponse.json({ error: "Enter cans delivered, cans taken back, or both." }, { status: 400 });
    }
    if (cansDelivered !== undefined && (!Number.isInteger(cansDelivered) || cansDelivered < 0)) {
      return NextResponse.json({ error: "Cans delivered must be a non-negative integer." }, { status: 400 });
    }
    if (cansTakenBack !== undefined && (!Number.isInteger(cansTakenBack) || cansTakenBack < 0)) {
      return NextResponse.json({ error: "Cans taken back must be a non-negative integer." }, { status: 400 });
    }
  }

  if (logType === "cash") {
    if (amountValue === undefined || !Number.isFinite(amountValue) || amountValue < 0) {
      return NextResponse.json({ error: "Amount must be a valid non-negative number." }, { status: 400 });
    }
    if (body.cashType !== "debit" && body.cashType !== "fuel") {
      return NextResponse.json({ error: "Cash type must be debit or fuel." }, { status: 400 });
    }
  }

  await connectToDatabase();

  let calculatedAmount = amountValue;
  if (logType === "water" && customerId && cansDelivered !== undefined && calculatedAmount === undefined) {
    const customer = await Customer.findOne({ _id: customerId, isActive: true }).lean();
    if (!customer) {
      return NextResponse.json({ error: "Customer not found or inactive." }, { status: 404 });
    }
    if (customer.cashPerCan !== undefined) {
      calculatedAmount = cansDelivered * customer.cashPerCan;
    }
  }

  try {
    const payload: Record<string, unknown> = {
      driver: new Types.ObjectId(driverId),
      suppliedAt,
      logType,
    };
    if (notes) payload.notes = notes;

    if (logType === "water") {
      payload.customer = new Types.ObjectId(customerId!);
      if (cansDelivered !== undefined) payload.cansDelivered = cansDelivered;
      if (cansTakenBack !== undefined) payload.cansTakenBack = cansTakenBack;
      if (vehicleId && Types.ObjectId.isValid(vehicleId)) payload.vehicle = new Types.ObjectId(vehicleId);
      if (calculatedAmount !== undefined) payload.amount = calculatedAmount;
    } else {
      payload.amount = amountValue;
      payload.cashType = body.cashType;
    }

    const created = await SupplyLog.create(payload);

    // Populate in place instead of re-fetching the document
    await created.populate([
      { path: "driver", select: "name username phone" },
      { path: "vehicle", select: "name vehicleNumber capacity" },
      { path: "customer", select: "name phone area" },
    ]);

    return NextResponse.json(created.toObject(), { status: 201 });
  } catch (err) {
    console.error("[admin supplies POST]", err);
    return NextResponse.json({ error: "Failed to save delivery log." }, { status: 500 });
  }
}
