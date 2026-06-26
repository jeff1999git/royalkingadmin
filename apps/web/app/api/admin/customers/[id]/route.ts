import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { connectToDatabase } from "../../../../../lib/mongodb";
import Customer from "../../../../../models/Customer";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid customer id." }, { status: 400 });
  }

  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    area?: string;
    locationType?: "home" | "office" | "both" | "";
    subscriptionCans?: number | string;
    cashPerCan?: number | string | null;
    isActive?: boolean;
    registeredDate?: string;
  };

  const setPayload: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    setPayload.name = name;
  }
  if (body.phone !== undefined) {
    const phone = body.phone.trim();
    if (!phone) return NextResponse.json({ error: "Phone cannot be empty." }, { status: 400 });
    setPayload.phone = phone;
  }
  if (body.email !== undefined) setPayload.email = body.email.trim() || undefined;
  if (body.address !== undefined) {
    const address = body.address.trim();
    if (!address) return NextResponse.json({ error: "Location cannot be empty." }, { status: 400 });
    setPayload.address = address;
  }
  if (body.area !== undefined) setPayload.area = body.area.trim() || undefined;
  if (body.locationType !== undefined) {
    if (body.locationType && body.locationType !== "home" && body.locationType !== "office" && body.locationType !== "both") {
      return NextResponse.json({ error: "Location type must be home, office, or both." }, { status: 400 });
    }
    setPayload.locationType = body.locationType || undefined;
  }
  if (body.subscriptionCans !== undefined) {
    const cans = Number(body.subscriptionCans);
    if (!Number.isInteger(cans) || cans < 1) {
      return NextResponse.json({ error: "Subscription cans must be a positive integer." }, { status: 400 });
    }
    setPayload.subscriptionCans = cans;
  }
  if (body.cashPerCan !== undefined) {
    if (body.cashPerCan === null || body.cashPerCan === "") {
      setPayload.cashPerCan = undefined;
    } else {
      const cashPerCan = Number(body.cashPerCan);
      if (isNaN(cashPerCan) || cashPerCan < 0) {
        return NextResponse.json({ error: "Cash per can must be a non-negative number." }, { status: 400 });
      }
      setPayload.cashPerCan = cashPerCan;
    }
  }
  if (body.isActive !== undefined) setPayload.isActive = Boolean(body.isActive);
  if (body.registeredDate !== undefined) {
    const d = new Date(body.registeredDate);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid registered date." }, { status: 400 });
    }
    setPayload.registeredDate = d;
  }

  if (Object.keys(setPayload).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const updated = await Customer.findByIdAndUpdate(
      id,
      { $set: setPayload },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json({ error: "A customer with this phone number already exists." }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid customer id." }, { status: 400 });
  }

  await connectToDatabase();
  const deleted = await Customer.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
