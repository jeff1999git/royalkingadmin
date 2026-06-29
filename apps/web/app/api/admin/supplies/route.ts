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
  const driverParam = req.nextUrl.searchParams.get("driver");
  const vehicleParam = req.nextUrl.searchParams.get("vehicle");
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const amountStatusParam = req.nextUrl.searchParams.get("amountStatus");
  const logTypeParam = req.nextUrl.searchParams.get("logType");

  const query: {
    suppliedAt?: { $gte: Date; $lte: Date };
    driver?: string;
    vehicle?: string;
    amount?: { $exists?: boolean; $ne?: null };
    logType?: "water" | "cash";
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

  try {
    await connectToDatabase();
    void Customer; // ensure model is registered for populate
    const hasPagination = Boolean(pageParam || limitParam);
    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
    const limit = Math.max(1, Math.min(100, Number.parseInt(limitParam ?? "10", 10) || 10));
    const skip = (page - 1) * limit;

    const baseQuery = SupplyLog.find(query)
      .populate("driver", "name username phone")
      .populate("vehicle", "name vehicleNumber capacity")
      .populate("customer", "name phone area")
      .sort({ suppliedAt: -1 });

    const logs = hasPagination
      ? await baseQuery.skip(skip).limit(limit).lean()
      : await baseQuery.lean();

    if (hasPagination) {
      const total = await SupplyLog.countDocuments(query);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return NextResponse.json({ logs, total, page, limit, totalPages });
    }

    return NextResponse.json(logs);
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
    const populated = await SupplyLog.findById(created._id)
      .populate("driver", "name username phone")
      .populate("vehicle", "name vehicleNumber capacity")
      .populate("customer", "name phone area")
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    console.error("[admin supplies POST]", err);
    return NextResponse.json({ error: "Failed to save delivery log." }, { status: 500 });
  }
}
