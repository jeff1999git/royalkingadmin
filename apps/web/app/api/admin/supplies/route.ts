import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { badRequest, notFound, optionalNumber, optionalString, readJsonObject, serverError, unauthorized } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/authHelpers";
import { istDateRange, istDayEnd, istDayStart, istMonthRange, parseSuppliedAtInput } from "../../../../lib/istTime";
import { connectToDatabase } from "../../../../lib/mongodb";
import {
  autoAmount,
  CASE_SIZE_GROUP,
  casesBySizeFrom,
  parseOptionalNumber,
  SUM_CASES,
  toProductType,
  validateDeliveryQuantities,
  type DeliveryQuantities,
} from "../../../../lib/supplyProduct";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";
import User from "../../../../models/User";
import Vehicle from "../../../../models/Vehicle";

// Fields the lists and exports never show. Leaving them out trims every row.
const LIST_PROJECTION = "-billImagePublicId -__v";
// Safety cap for the unpaginated (export) request.
const EXPORT_MAX_ROWS = 5000;
// Page 1 of the recent window holds the whole window.
const WINDOW_MAX_ROWS = 500;

function parseMonthRange(monthText: string) {
  const parts = monthText.split("-");
  if (parts.length !== 2) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return istMonthRange(year, month);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

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
  const productTypeParam = req.nextUrl.searchParams.get("productType");

  // Values are stored pre-cast (ObjectId, Date) so the same query object works
  // for both find() and aggregate() — aggregation pipelines skip schema casting.
  const query: {
    suppliedAt?: { $gte?: Date; $lte?: Date; $lt?: Date };
    driver?: Types.ObjectId;
    vehicle?: Types.ObjectId;
    customer?: Types.ObjectId;
    amount?: { $exists?: boolean; $ne?: null };
    logType?: "water" | "cash";
    paymentStatus?: "upi" | "not_paid" | { $nin: ("upi" | "not_paid")[] };
    productType?: "case" | { $ne: "case" };
  } = {};

  if (dateParam) {
    const dateRange = istDateRange(dateParam);
    if (!dateRange) return badRequest("Invalid date format.");
    query.suppliedAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  if (monthParam) {
    const monthRange = parseMonthRange(monthParam);
    if (!monthRange) return badRequest("Invalid month format.");
    query.suppliedAt = { $gte: monthRange.start, $lte: monthRange.end };
  }

  // Rolling recent window (e.g. days=5 → today plus previous 4 days). Page 1
  // serves the whole window; later pages walk records older than the window.
  // Explicit date/month filters win over the window.
  let windowStart: Date | null = null;
  if (daysParam && !dateParam && !monthParam) {
    const days = Number.parseInt(daysParam, 10);
    if (!Number.isInteger(days) || days < 1 || days > 366) return badRequest("Invalid days value.");
    windowStart = new Date(istDayStart().getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  }

  if (driverParam) {
    if (!Types.ObjectId.isValid(driverParam)) return badRequest("Invalid driver id.");
    query.driver = new Types.ObjectId(driverParam);
  }

  if (vehicleParam) {
    if (!Types.ObjectId.isValid(vehicleParam)) return badRequest("Invalid vehicle id.");
    query.vehicle = new Types.ObjectId(vehicleParam);
  }

  if (customerParam) {
    if (!Types.ObjectId.isValid(customerParam)) return badRequest("Invalid customer id.");
    query.customer = new Types.ObjectId(customerParam);
  }

  if (amountStatusParam === "pending") {
    query.amount = { $exists: false };
  } else if (amountStatusParam === "added") {
    query.amount = { $exists: true, $ne: null };
  } else if (amountStatusParam && amountStatusParam !== "all") {
    return badRequest("Invalid amountStatus value.");
  }

  if (logTypeParam === "water" || logTypeParam === "cash") {
    query.logType = logTypeParam;
  } else if (logTypeParam) {
    return badRequest("Invalid logType value.");
  }

  if (paymentStatusParam === "cash") {
    // Include records explicitly marked "cash" AND old records with no field set
    query.paymentStatus = { $nin: ["upi", "not_paid"] };
  } else if (paymentStatusParam === "upi" || paymentStatusParam === "not_paid") {
    query.paymentStatus = paymentStatusParam;
  } else if (paymentStatusParam && paymentStatusParam !== "") {
    return badRequest("Invalid paymentStatus value.");
  }

  if (productTypeParam === "can") {
    // Include records explicitly marked "can" AND old records with no field set
    query.productType = { $ne: "case" };
  } else if (productTypeParam === "case") {
    query.productType = "case";
  } else if (productTypeParam) {
    return badRequest("Invalid productType value.");
  }

  try {
    await connectToDatabase();
    const hasPagination = Boolean(pageParam || limitParam);
    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
    const limit = Math.max(1, Math.min(200, Number.parseInt(limitParam ?? "10", 10) || 10));

    if (windowStart) {
      if (!hasPagination || page === 1) {
        query.suppliedAt = { $gte: windowStart, $lte: istDayEnd() };
      } else {
        query.suppliedAt = { $lt: windowStart };
      }
    }

    // Window mode: page 1 holds the entire recent window, pages 2+ step
    // through older records limit at a time.
    const skip = windowStart ? (page <= 1 ? 0 : (page - 2) * limit) : (page - 1) * limit;
    const fetchLimit = windowStart && page === 1 ? WINDOW_MAX_ROWS : limit;

    const findQuery = SupplyLog.find(query)
      .select(LIST_PROJECTION)
      .populate("driver", "name username phone")
      .populate("vehicle", "name vehicleNumber capacity")
      .populate("customer", "name phone area")
      .sort({ suppliedAt: -1 });

    if (!hasPagination) {
      const logs = await findQuery.limit(EXPORT_MAX_ROWS).lean();
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
            totalCases: SUM_CASES,
            ...CASE_SIZE_GROUP,
            totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
            driverIds: { $addToSet: "$driver" },
            customerIds: { $addToSet: "$customer" },
          },
        },
      ]),
      extraCountPromise,
    ]);

    const agg = aggResult[0] as { count: number; totalCans: number; totalCansTakenBack: number; totalCases: number; totalAmount: number; driverIds: unknown[]; customerIds: unknown[] } | undefined;
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
      totalCases: agg?.totalCases ?? 0,
      casesBySize: casesBySizeFrom(agg),
      totalAmount: Math.round((agg?.totalAmount ?? 0) * 100) / 100,
      uniqueDrivers: agg?.driverIds?.length ?? 0,
      uniqueCustomers: agg?.customerIds?.length ?? 0,
    };

    return NextResponse.json({ logs, total, page, limit, totalPages, serialStart, stats });
  } catch (err) {
    return serverError(err, "Failed to load entries.");
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  const logType = body.logType === "cash" ? "cash" : "water";
  const driverId = optionalString(body.driverId, 64);
  const customerId = optionalString(body.customerId, 64);
  const vehicleId = optionalString(body.vehicleId, 64);
  const notes = optionalString(body.notes, 1000) || undefined;

  const suppliedAt = body.suppliedAt === undefined || body.suppliedAt === null || body.suppliedAt === ""
    ? new Date()
    : parseSuppliedAtInput(body.suppliedAt);
  if (!suppliedAt) return badRequest("Invalid delivery date.");

  if (!driverId || !Types.ObjectId.isValid(driverId)) return badRequest("Valid driver is required.");
  if (vehicleId && !Types.ObjectId.isValid(vehicleId)) return badRequest("Invalid vehicle id.");

  const productType = toProductType(body.productType);
  const quantities: DeliveryQuantities = {
    productType,
    cansDelivered: parseOptionalNumber(body.cansDelivered),
    cansTakenBack: parseOptionalNumber(body.cansTakenBack),
    casesDelivered: parseOptionalNumber(body.casesDelivered),
    caseSize: optionalString(body.caseSize, 10) || undefined,
    casePrice: parseOptionalNumber(body.casePrice),
  };

  // An amount typed by the admin. Anything sent that isn't a non-negative
  // number is rejected rather than stored as NaN.
  const amountSent = body.amount !== undefined && body.amount !== null && body.amount !== "";
  const amountValue = amountSent ? optionalNumber(body.amount) : undefined;
  if (amountSent && (amountValue === undefined || amountValue < 0)) {
    return badRequest("Amount must be a valid non-negative number.");
  }

  if (logType === "water") {
    if (!customerId || !Types.ObjectId.isValid(customerId)) return badRequest("Valid customer is required.");
    const quantityError = validateDeliveryQuantities(quantities);
    if (quantityError) return badRequest(quantityError);
  } else {
    if (amountValue === undefined) return badRequest("Amount must be a valid non-negative number.");
    if (body.cashType !== "debit" && body.cashType !== "fuel") return badRequest("Cash type must be debit or fuel.");
  }

  try {
    await connectToDatabase();

    // The driver, customer and vehicle must all exist; the customer must be
    // active. Checked together in one round trip.
    const [driver, customer, vehicle] = await Promise.all([
      User.exists({ _id: driverId, role: "driver" }),
      logType === "water" && customerId
        ? Customer.findOne({ _id: customerId, isActive: true }).select("cashPerCan").lean()
        : Promise.resolve(null),
      vehicleId ? Vehicle.exists({ _id: vehicleId }) : Promise.resolve(null),
    ]);
    if (!driver) return badRequest("Driver not found.");
    if (logType === "water" && !customer) return notFound("Customer not found or inactive.");
    if (vehicleId && !vehicle) return badRequest("Vehicle not found.");

    const payload: Record<string, unknown> = {
      driver: new Types.ObjectId(driverId),
      suppliedAt,
      logType,
    };
    if (notes) payload.notes = notes;

    if (logType === "water") {
      payload.customer = new Types.ObjectId(customerId!);
      payload.productType = productType;
      if (productType === "case") {
        payload.casesDelivered = quantities.casesDelivered;
        payload.caseSize = quantities.caseSize;
        payload.casePrice = quantities.casePrice;
      } else {
        if (quantities.cansDelivered !== undefined) payload.cansDelivered = quantities.cansDelivered;
        if (quantities.cansTakenBack !== undefined) payload.cansTakenBack = quantities.cansTakenBack;
      }
      if (vehicleId) payload.vehicle = new Types.ObjectId(vehicleId);
      // An amount typed by the admin wins; otherwise cans are priced from the
      // customer's rate and cases from the price per case entered here.
      const amount = amountValue ?? autoAmount(customer, quantities);
      if (amount !== undefined) payload.amount = amount;
    } else {
      payload.amount = amountValue;
      payload.cashType = body.cashType;
    }

    const created = await SupplyLog.create(payload);
    return NextResponse.json(created.toObject(), { status: 201 });
  } catch (err) {
    return serverError(err, "Failed to save delivery log.");
  }
}
