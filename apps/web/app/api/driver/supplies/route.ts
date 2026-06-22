import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../../../../lib/cloudinary";
import { connectToDatabase } from "../../../../lib/mongodb";
import SupplyLog from "../../../../models/SupplyLog";
import Customer from "../../../../models/Customer";

type DriverSupplyRequestBody = {
  logType?: "water" | "cash";
  customerId?: string;
  cansDelivered?: number | string;
  cansTakenBack?: number | string;
  vehicleId?: string;
  notes?: string;
  amount?: number | string;
  cashType?: "debit" | "fuel";
  billImageFile?: File | null;
};

async function parseDriverSupplyRequest(req: NextRequest): Promise<DriverSupplyRequestBody> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const billImage = formData.get("billImage");

    return {
      logType: typeof formData.get("logType") === "string" ? (formData.get("logType") as "water" | "cash") : undefined,
      customerId: typeof formData.get("customerId") === "string" ? formData.get("customerId") as string : undefined,
      cansDelivered: typeof formData.get("cansDelivered") === "string" ? formData.get("cansDelivered") as string : undefined,
      cansTakenBack: typeof formData.get("cansTakenBack") === "string" ? formData.get("cansTakenBack") as string : undefined,
      vehicleId: typeof formData.get("vehicleId") === "string" ? formData.get("vehicleId") as string : undefined,
      notes: typeof formData.get("notes") === "string" ? formData.get("notes") as string : undefined,
      amount: typeof formData.get("amount") === "string" ? formData.get("amount") as string : undefined,
      cashType: typeof formData.get("cashType") === "string" ? (formData.get("cashType") as "debit" | "fuel") : undefined,
      billImageFile: billImage instanceof File && billImage.size > 0 ? billImage : null,
    };
  }

  return (await req.json()) as DriverSupplyRequestBody;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const logs = await SupplyLog.find({ driver: session.user.id })
    .populate("vehicle", "name vehicleNumber capacity")
    .populate("customer", "name phone area")
    .sort({ suppliedAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseDriverSupplyRequest(req);
  const logType = body.logType === "cash" ? "cash" : "water";
  const customerId = body.customerId?.trim();
  const vehicleId = body.vehicleId?.trim();
  const notes = body.notes?.trim();
  const cansDelivered =
    body.cansDelivered === undefined || body.cansDelivered === ""
      ? undefined
      : Number(body.cansDelivered);
  const cansTakenBack =
    body.cansTakenBack === undefined || body.cansTakenBack === ""
      ? undefined
      : Number(body.cansTakenBack);
  const amountValue =
    body.amount === undefined || body.amount === null || body.amount === ""
      ? undefined
      : Number(body.amount);
  const cashType = body.cashType;
  const billImageFile = body.billImageFile ?? null;

  if (logType === "water") {
    if (!customerId) {
      return NextResponse.json({ error: "Customer is required." }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer." }, { status: 400 });
    }
    if (cansDelivered === undefined || !Number.isInteger(cansDelivered) || cansDelivered < 1) {
      return NextResponse.json({ error: "Cans delivered must be a positive number." }, { status: 400 });
    }
    if (vehicleId && !Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle." }, { status: 400 });
    }
    if (cansTakenBack !== undefined && (!Number.isInteger(cansTakenBack) || cansTakenBack < 0)) {
      return NextResponse.json({ error: "Cans taken back must be a non-negative integer." }, { status: 400 });
    }
  }

  if (logType === "cash") {
    if (amountValue === undefined || !Number.isFinite(amountValue) || amountValue < 0) {
      return NextResponse.json({ error: "Amount must be a valid non-negative number." }, { status: 400 });
    }
    if (cashType !== "debit" && cashType !== "fuel") {
      return NextResponse.json({ error: "Cash type must be debit or fuel." }, { status: 400 });
    }
    if (billImageFile && !billImageFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload a valid image file." }, { status: 400 });
    }
    if (billImageFile && billImageFile.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image is too large. Please keep it under 8 MB." }, { status: 400 });
    }
    if (cashType === "fuel" && !billImageFile) {
      return NextResponse.json({ error: "Fuel bill image is required for fuel entries." }, { status: 400 });
    }
  }

  await connectToDatabase();

  if (logType === "water" && customerId) {
    const customer = await Customer.findOne({ _id: customerId, isActive: true }).lean();
    if (!customer) {
      return NextResponse.json({ error: "Customer not found or inactive." }, { status: 404 });
    }
  }

  let uploadedBillImage: { secureUrl: string; publicId: string } | null = null;

  try {
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
      cansDelivered?: number;
      cansTakenBack?: number;
      amount?: number;
      cashType?: "debit" | "fuel";
      billImageUrl?: string;
      billImagePublicId?: string;
    } = {
      driver: session.user.id,
      suppliedAt: new Date(),
      notes,
      logType,
    };

    if (logType === "water") {
      payload.customer = customerId;
      payload.cansDelivered = cansDelivered;
      if (cansTakenBack !== undefined) payload.cansTakenBack = cansTakenBack;
      if (vehicleId) payload.vehicle = vehicleId;
    } else {
      payload.amount = amountValue;
      payload.cashType = cashType;
      if (uploadedBillImage) {
        payload.billImageUrl = uploadedBillImage.secureUrl;
        payload.billImagePublicId = uploadedBillImage.publicId;
      }
    }

    const created = await SupplyLog.create(payload);

    const populated = await SupplyLog.findById(created._id)
      .populate("vehicle", "name vehicleNumber capacity")
      .populate("customer", "name phone area")
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    if (uploadedBillImage?.publicId) {
      await deleteImageFromCloudinary(uploadedBillImage.publicId).catch(() => undefined);
    }

    const message =
      error instanceof Error ? error.message : "Failed to save delivery log.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
