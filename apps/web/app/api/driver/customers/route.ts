import { NextRequest, NextResponse } from "next/server";
import { badRequest, optionalNumber, optionalString, readJsonObject, requiredString, serverError, unauthorized } from "../../../../lib/api";
import { requireDriver } from "../../../../lib/authHelpers";
import { createOrRestoreCustomer } from "../../../../lib/customers";
import { connectToDatabase } from "../../../../lib/mongodb";
import Customer from "../../../../models/Customer";

export async function GET() {
  const driver = await requireDriver();
  if (!driver) return unauthorized();

  try {
    await connectToDatabase();
    const customers = await Customer.find({ isActive: true })
      .select("name phone area subscriptionCans cashPerCan locationType")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(customers);
  } catch (err) {
    return serverError(err, "Failed to load customers.");
  }
}

export async function POST(req: NextRequest) {
  const driver = await requireDriver();
  if (!driver) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  const name = requiredString(body.name, 120);
  const phone = requiredString(body.phone, 30);
  const email = optionalString(body.email, 120) || undefined;
  const address = requiredString(body.address, 500);
  const locationType = body.locationType;
  const cashPerCanSent = body.cashPerCan !== undefined && body.cashPerCan !== null && body.cashPerCan !== "";
  const cashPerCan = cashPerCanSent ? optionalNumber(body.cashPerCan) : undefined;

  if (!name) return badRequest("Name is required.");
  if (!phone) return badRequest("Phone is required.");
  if (!address) return badRequest("Location is required.");
  if (!cashPerCanSent) return badRequest("Cash per can is required.");
  if (cashPerCan === undefined || cashPerCan < 0) return badRequest("Cash per can must be a non-negative number.");
  if (locationType !== undefined && locationType !== "home" && locationType !== "office" && locationType !== "both") {
    return badRequest("Location type must be home, office, or both.");
  }

  try {
    await connectToDatabase();
    const result = await createOrRestoreCustomer({
      name,
      phone,
      email,
      address,
      locationType,
      subscriptionCans: 1,
      cashPerCan,
      registeredDate: new Date(),
      createdBy: driver.id,
    });
    if ("duplicate" in result) {
      return NextResponse.json({ error: "A customer with this phone number already exists." }, { status: 409 });
    }
    return NextResponse.json(result.customer, { status: 201 });
  } catch (err) {
    return serverError(err, "Failed to register the customer.");
  }
}
