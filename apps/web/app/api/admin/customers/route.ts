import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import Customer from "../../../../models/Customer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const customers = await Customer.find({ isDeleted: { $ne: true } })
    .sort({ isActive: -1, name: 1 })
    .lean();

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    area?: string;
    locationType?: "home" | "office" | "both";
    subscriptionCans?: number | string;
    cashPerCan?: number | string;
    registeredDate?: string;
  };

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim() || undefined;
  const address = body.address?.trim();
  const area = body.area?.trim() || undefined;
  const locationType = body.locationType;
  const subscriptionCans = Number(body.subscriptionCans ?? 1);
  const cashPerCan = body.cashPerCan !== undefined && body.cashPerCan !== "" ? Number(body.cashPerCan) : undefined;
  const registeredDate = body.registeredDate ? new Date(body.registeredDate) : new Date();

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required." }, { status: 400 });
  if (!address) return NextResponse.json({ error: "Location is required." }, { status: 400 });
  if (!Number.isInteger(subscriptionCans) || subscriptionCans < 1) {
    return NextResponse.json({ error: "Subscription cans must be a positive integer." }, { status: 400 });
  }
  if (cashPerCan !== undefined && (isNaN(cashPerCan) || cashPerCan < 0)) {
    return NextResponse.json({ error: "Cash per can must be a non-negative number." }, { status: 400 });
  }
  if (locationType && locationType !== "home" && locationType !== "office" && locationType !== "both") {
    return NextResponse.json({ error: "Location type must be home, office, or both." }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      area,
      locationType,
      subscriptionCans,
      cashPerCan,
      registeredDate,
      ...(Types.ObjectId.isValid(session.user.id) ? { createdBy: session.user.id } : {}),
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json({ error: "A customer with this phone number already exists." }, { status: 409 });
    }
    throw err;
  }
}
