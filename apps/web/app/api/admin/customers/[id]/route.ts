import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { badRequest, jsonError, notFound, optionalNumber, optionalString, readJsonObject, serverError, unauthorized } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/authHelpers";
import { connectToDatabase } from "../../../../../lib/mongodb";
import Customer from "../../../../../models/Customer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid customer id.");

  try {
    await connectToDatabase();
    const customer = await Customer.findById(id).lean();
    if (!customer) return notFound("Customer not found.");

    return NextResponse.json(customer);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid customer id.");

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  const setPayload: Record<string, unknown> = {};
  const unsetPayload: Record<string, 1> = {};

  if (body.name !== undefined) {
    const name = optionalString(body.name, 200);
    if (!name) return badRequest("Name cannot be empty.");
    setPayload.name = name;
  }
  if (body.phone !== undefined) {
    const phone = optionalString(body.phone, 30);
    if (!phone) return badRequest("Phone cannot be empty.");
    setPayload.phone = phone;
  }
  if (body.email !== undefined) {
    const email = optionalString(body.email, 200);
    if (email) setPayload.email = email;
    else unsetPayload.email = 1;
  }
  if (body.address !== undefined) {
    const address = optionalString(body.address, 1000);
    if (!address) return badRequest("Location cannot be empty.");
    setPayload.address = address;
  }
  if (body.area !== undefined) {
    const area = optionalString(body.area, 200);
    if (area) setPayload.area = area;
    else unsetPayload.area = 1;
  }
  if (body.locationType !== undefined) {
    const locationType = body.locationType;
    if (locationType && locationType !== "home" && locationType !== "office" && locationType !== "both") {
      return badRequest("Location type must be home, office, or both.");
    }
    if (locationType) setPayload.locationType = locationType;
    else unsetPayload.locationType = 1;
  }
  if (body.subscriptionCans !== undefined) {
    const cans = optionalNumber(body.subscriptionCans);
    if (cans === undefined || !Number.isInteger(cans) || cans < 1) {
      return badRequest("Subscription cans must be a positive integer.");
    }
    setPayload.subscriptionCans = cans;
  }
  if (body.cashPerCan !== undefined) {
    if (body.cashPerCan === null || body.cashPerCan === "") {
      unsetPayload.cashPerCan = 1;
    } else {
      const cashPerCan = optionalNumber(body.cashPerCan);
      if (cashPerCan === undefined || cashPerCan < 0) {
        return badRequest("Cash per can must be a non-negative number.");
      }
      setPayload.cashPerCan = cashPerCan;
    }
  }
  if (body.securityDeposit !== undefined) {
    if (body.securityDeposit === null || body.securityDeposit === "") {
      unsetPayload.securityDeposit = 1;
    } else {
      const securityDeposit = optionalNumber(body.securityDeposit);
      if (securityDeposit === undefined || securityDeposit < 0) {
        return badRequest("Security deposit must be a non-negative number.");
      }
      setPayload.securityDeposit = securityDeposit;
    }
  }
  if (body.isActive !== undefined) setPayload.isActive = Boolean(body.isActive);
  if (body.registeredDate !== undefined) {
    const d = new Date(typeof body.registeredDate === "string" ? body.registeredDate : NaN);
    if (Number.isNaN(d.getTime())) return badRequest("Invalid registered date.");
    setPayload.registeredDate = d;
  }

  const hasSet = Object.keys(setPayload).length > 0;
  const hasUnset = Object.keys(unsetPayload).length > 0;
  if (!hasSet && !hasUnset) return badRequest("Nothing to update.");

  try {
    await connectToDatabase();
    const updateOp: Record<string, unknown> = {};
    if (hasSet) updateOp.$set = setPayload;
    if (hasUnset) updateOp.$unset = unsetPayload;

    const updated = await Customer.findByIdAndUpdate(
      id,
      updateOp,
      { returnDocument: "after" }
    ).lean();

    if (!updated) return notFound("Customer not found.");

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return jsonError("A customer with this phone number already exists.", 409);
    }
    return serverError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid customer id.");

  try {
    await connectToDatabase();
    const updated = await Customer.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, isActive: false } },
      { returnDocument: "after" }
    ).select("_id").lean();
    if (!updated) return notFound("Customer not found.");

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
