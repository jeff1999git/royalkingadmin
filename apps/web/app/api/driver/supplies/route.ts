import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { badRequest, isPlainObject, notFound, optionalNumber, optionalString, serverError, unauthorized } from "../../../../lib/api";
import { requireDriver } from "../../../../lib/authHelpers";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../../../../lib/cloudinary";
import { istDateRange, istDayEnd, istDayStart } from "../../../../lib/istTime";
import { connectToDatabase } from "../../../../lib/mongodb";
import {
  autoAmount,
  parseOptionalNumber,
  toProductType,
  validateDeliveryQuantities,
  type CaseSize,
  type DeliveryQuantities,
  type ProductType,
} from "../../../../lib/supplyProduct";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";
import Vehicle from "../../../../models/Vehicle";

// Vercel refuses function request bodies over 4.5 MB, so stay under it.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// The multipart body is the image plus a few short fields.
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const RECENT_DAYS = 5;
// Fields the driver screens never show.
const LIST_PROJECTION = "-billImagePublicId -adminRemark -__v";

type DriverSupplyRequestBody = {
  logType?: unknown;
  customerId?: unknown;
  productType?: unknown;
  cansDelivered?: unknown;
  cansTakenBack?: unknown;
  casesDelivered?: unknown;
  caseSize?: unknown;
  casePrice?: unknown;
  vehicleId?: unknown;
  notes?: unknown;
  amount?: unknown;
  cashType?: unknown;
  paymentStatus?: unknown;
  billImageFile?: File | null;
};

// JSON for deliveries; multipart when a fuel-bill photo comes along. Returns
// null for a body that can't be read.
async function parseDriverSupplyRequest(req: NextRequest): Promise<DriverSupplyRequestBody | null> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return null;
    }
    const text = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : undefined;
    };
    const billImage = formData.get("billImage");
    return {
      logType: text("logType"),
      customerId: text("customerId"),
      cansDelivered: text("cansDelivered"),
      cansTakenBack: text("cansTakenBack"),
      productType: text("productType"),
      casesDelivered: text("casesDelivered"),
      caseSize: text("caseSize"),
      casePrice: text("casePrice"),
      vehicleId: text("vehicleId"),
      notes: text("notes"),
      amount: text("amount"),
      cashType: text("cashType"),
      paymentStatus: text("paymentStatus"),
      billImageFile: billImage instanceof File && billImage.size > 0 ? billImage : null,
    };
  }

  try {
    const body: unknown = await req.json();
    return isPlainObject(body) ? (body as DriverSupplyRequestBody) : null;
  } catch {
    return null;
  }
}

// The client converts everything but HEIC/HEIF to JPEG before upload. Some
// phones send HEIC with an empty MIME type, so the extension counts too.
function isAcceptedImage(file: File) {
  if (file.type.startsWith("image/")) return true;
  return file.type === "" && /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name);
}

export async function GET(req: NextRequest) {
  const driver = await requireDriver();
  if (!driver) return unauthorized();

  // Default: only the last RECENT_DAYS days. A specific ?date=YYYY-MM-DD fetches that day on demand.
  const dateParam = req.nextUrl.searchParams.get("date");
  let start: Date;
  let end: Date;
  if (dateParam) {
    const range = istDateRange(dateParam);
    if (!range) return badRequest("Invalid date format.");
    start = range.start;
    end = range.end;
  } else {
    end = istDayEnd();
    start = new Date(istDayStart().getTime() - (RECENT_DAYS - 1) * 24 * 60 * 60 * 1000);
  }

  try {
    await connectToDatabase();
    const logs = await SupplyLog.find({
      driver: driver.id,
      suppliedAt: { $gte: start, $lte: end },
    })
      .select(LIST_PROJECTION)
      .populate("vehicle", "name vehicleNumber capacity")
      .populate("customer", "name phone area")
      .sort({ suppliedAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json(logs);
  } catch (err) {
    return serverError(err, "Failed to load your entries.");
  }
}

export async function POST(req: NextRequest) {
  const driver = await requireDriver();
  if (!driver) return unauthorized();

  // Refuse an oversized upload before reading it into memory.
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return badRequest("Image is too large. Please keep it under 4 MB.");
  }

  const body = await parseDriverSupplyRequest(req);
  if (!body) return badRequest("Invalid request body.");

  const logType = body.logType === "cash" ? "cash" : "water";
  const customerId = optionalString(body.customerId, 64);
  const vehicleId = optionalString(body.vehicleId, 64);
  const notes = optionalString(body.notes, 1000) || undefined;
  const productType = toProductType(body.productType);
  const quantities: DeliveryQuantities = {
    productType,
    cansDelivered: parseOptionalNumber(body.cansDelivered),
    cansTakenBack: parseOptionalNumber(body.cansTakenBack),
    casesDelivered: parseOptionalNumber(body.casesDelivered),
    caseSize: optionalString(body.caseSize, 10) || undefined,
    casePrice: parseOptionalNumber(body.casePrice),
  };
  const amountValue = optionalNumber(body.amount);
  const cashType = body.cashType === "debit" || body.cashType === "fuel" ? body.cashType : undefined;
  const billImageFile = body.billImageFile ?? null;

  if (logType === "water") {
    if (!customerId) return badRequest("Customer is required.");
    if (!Types.ObjectId.isValid(customerId)) return badRequest("Invalid customer.");
    const quantityError = validateDeliveryQuantities(quantities);
    if (quantityError) return badRequest(quantityError);
    if (vehicleId && !Types.ObjectId.isValid(vehicleId)) return badRequest("Invalid vehicle.");
  } else {
    if (amountValue === undefined || amountValue < 0) return badRequest("Amount must be a valid non-negative number.");
    if (!cashType) return badRequest("Cash type must be debit or fuel.");
    if (billImageFile && !isAcceptedImage(billImageFile)) return badRequest("Please upload a valid image file.");
    if (billImageFile && billImageFile.size > MAX_IMAGE_BYTES) return badRequest("Image is too large. Please keep it under 4 MB.");
    if (cashType === "fuel" && !billImageFile) return badRequest("Fuel bill image is required for fuel entries.");
  }

  let uploadedBillImage: { secureUrl: string; publicId: string } | null = null;

  try {
    await connectToDatabase();

    let calculatedAmount: number | undefined;
    if (logType === "water" && customerId) {
      const [customer, vehicle] = await Promise.all([
        Customer.findOne({ _id: customerId, isActive: true }).select("cashPerCan").lean(),
        vehicleId ? Vehicle.exists({ _id: vehicleId }) : Promise.resolve(null),
      ]);
      if (!customer) return notFound("Customer not found or inactive.");
      if (vehicleId && !vehicle) return badRequest("Vehicle not found.");
      calculatedAmount = autoAmount(customer, quantities);
    }

    if (logType === "cash" && billImageFile) {
      uploadedBillImage = await uploadImageToCloudinary(billImageFile);
    }

    const payload: {
      driver: string;
      suppliedAt: Date;
      notes?: string;
      logType: "water" | "cash";
      customer?: string;
      vehicle?: string;
      productType?: ProductType;
      cansDelivered?: number;
      cansTakenBack?: number;
      casesDelivered?: number;
      caseSize?: CaseSize;
      casePrice?: number;
      amount?: number;
      paymentStatus?: "cash" | "upi" | "not_paid";
      cashType?: "debit" | "fuel";
      billImageUrl?: string;
      billImagePublicId?: string;
    } = {
      driver: driver.id,
      suppliedAt: new Date(),
      logType,
    };
    if (notes) payload.notes = notes;

    if (logType === "water") {
      payload.customer = customerId;
      payload.productType = productType;
      if (productType === "case") {
        payload.casesDelivered = quantities.casesDelivered;
        payload.caseSize = quantities.caseSize as CaseSize; // validated above
        payload.casePrice = quantities.casePrice;
      } else {
        if (quantities.cansDelivered !== undefined) payload.cansDelivered = quantities.cansDelivered;
        if (quantities.cansTakenBack !== undefined) payload.cansTakenBack = quantities.cansTakenBack;
      }
      if (vehicleId) payload.vehicle = vehicleId;
      if (calculatedAmount !== undefined) payload.amount = calculatedAmount;
      const ps = body.paymentStatus;
      payload.paymentStatus = ps === "upi" || ps === "not_paid" ? ps : "cash";
    } else {
      payload.amount = amountValue;
      payload.cashType = cashType;
      if (uploadedBillImage) {
        payload.billImageUrl = uploadedBillImage.secureUrl;
        payload.billImagePublicId = uploadedBillImage.publicId;
      }
    }

    const created = await SupplyLog.create(payload);
    // The driver screen only checks res.ok and refetches its list, so the row
    // goes back as saved, without extra populate queries.
    return NextResponse.json(created.toObject(), { status: 201 });
  } catch (error) {
    if (uploadedBillImage?.publicId) {
      await deleteImageFromCloudinary(uploadedBillImage.publicId).catch(() => undefined);
    }
    // Upload problems carry a message written for the driver; anything else is
    // logged and answered generically.
    if (error instanceof Error && /upload|timed out/i.test(error.message)) {
      console.error("[driver supplies POST]", error);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return serverError(error, "Failed to save the entry. Please try again.");
  }
}
