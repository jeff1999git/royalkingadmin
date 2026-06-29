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
  const unsetPayload: Record<string, 1> = {};

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
  if (body.email !== undefined) {
    const email = body.email.trim();
    if (email) setPayload.email = email;
    else unsetPayload.email = 1;
  }
  if (body.address !== undefined) {
    const address = body.address.trim();
    if (!address) return NextResponse.json({ error: "Location cannot be empty." }, { status: 400 });
    setPayload.address = address;
  }
  if (body.area !== undefined) {
    const area = body.area.trim();
    if (area) setPayload.area = area;
    else unsetPayload.area = 1;
  }
  if (body.locationType !== undefined) {
    if (body.locationType && body.locationType !== "home" && body.locationType !== "office" && body.locationType !== "both") {
      return NextResponse.json({ error: "Location type must be home, office, or both." }, { status: 400 });
    }
    if (body.locationType) setPayload.locationType = body.locationType;
    else unsetPayload.locationType = 1;
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
      unsetPayload.cashPerCan = 1;
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

  const hasSet = Object.keys(setPayload).length > 0;
  const hasUnset = Object.keys(unsetPayload).length > 0;
  if (!hasSet && !hasUnset) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const updateOp: Record<string, unknown> = {};
    if (hasSet) updateOp.$set = setPayload;
    if (hasUnset) updateOp.$unset = unsetPayload;

    const updated = await Customer.findByIdAndUpdate(
      id,
      updateOp,
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
  const updated = await Customer.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true, isActive: false } },
    { new: true }
  ).lean();
  if (!updated) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
