import { NextRequest, NextResponse } from "next/server";
import { badRequest, optionalNumber, readJsonObject, serverError, unauthorized } from "../../../lib/api";
import { getServerUser } from "../../../lib/authHelpers";
import { connectToDatabase } from "../../../lib/mongodb";
import Stock from "../../../models/Stock";

const EMPTY_STOCK = { cans: 0, dispensers: 0, stands: 0 };

// Stock is shared by the admin and every driver. A session whose role was
// stripped (deactivated driver, see lib/auth.ts) is not signed in here either.
async function requireAnyRole() {
  const user = await getServerUser();
  return user && (user.role === "admin" || user.role === "driver") ? user : null;
}

export async function GET() {
  const user = await requireAnyRole();
  if (!user) return unauthorized();

  try {
    await connectToDatabase();

    // Read-only: the first PATCH creates the document.
    const stock = await Stock.findOne({}).lean();

    return NextResponse.json(stock ?? EMPTY_STOCK);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest) {
  const user = await requireAnyRole();
  if (!user) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Invalid request body.");

  const cans = body.cans !== undefined ? optionalNumber(body.cans) : undefined;
  const dispensers = body.dispensers !== undefined ? optionalNumber(body.dispensers) : undefined;
  const stands = body.stands !== undefined ? optionalNumber(body.stands) : undefined;

  if (body.cans !== undefined && (cans === undefined || cans < 0)) {
    return badRequest("Cans must be a non-negative number.");
  }
  if (body.dispensers !== undefined && (dispensers === undefined || dispensers < 0)) {
    return badRequest("Dispensers must be a non-negative number.");
  }
  if (body.stands !== undefined && (stands === undefined || stands < 0)) {
    return badRequest("Stands must be a non-negative number.");
  }

  const updatedBy =
    user.role === "admin" ? "Admin" : (user.name ?? "Driver");

  const setPayload: {
    cans?: number;
    dispensers?: number;
    stands?: number;
    updatedBy: string;
  } = { updatedBy };
  if (cans !== undefined) setPayload.cans = Math.floor(cans);
  if (dispensers !== undefined) setPayload.dispensers = Math.floor(dispensers);
  if (stands !== undefined) setPayload.stands = Math.floor(stands);

  try {
    await connectToDatabase();

    const updated = await Stock.findOneAndUpdate(
      {},
      { $set: setPayload },
      { upsert: true, returnDocument: "after" }
    ).lean();

    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err);
  }
}
