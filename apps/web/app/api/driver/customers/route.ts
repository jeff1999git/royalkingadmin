import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import Customer from "../../../../models/Customer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const customers = await Customer.find({ isActive: true })
    .select("name phone area subscriptionCans cashPerCan locationType")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    locationType?: "home" | "office";
    cashPerCan?: number | string;
  };

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim() || undefined;
  const address = body.address?.trim();
  const locationType = body.locationType;
  const cashPerCan = body.cashPerCan !== undefined && body.cashPerCan !== "" ? Number(body.cashPerCan) : undefined;

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required." }, { status: 400 });
  if (!address) return NextResponse.json({ error: "Location is required." }, { status: 400 });
  if (cashPerCan !== undefined && (isNaN(cashPerCan) || cashPerCan < 0)) {
    return NextResponse.json({ error: "Cash per can must be a non-negative number." }, { status: 400 });
  }
  if (locationType && locationType !== "home" && locationType !== "office") {
    return NextResponse.json({ error: "Location type must be home or office." }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      locationType,
      subscriptionCans: 1,
      cashPerCan,
      createdBy: session.user.id,
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json({ error: "A customer with this phone number already exists." }, { status: 409 });
    }
    throw err;
  }
}
