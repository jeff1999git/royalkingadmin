import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { connectToDatabase } from "../../../lib/mongodb";
import Stock from "../../../models/Stock";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  let stock = await Stock.findOne().lean();
  if (!stock) {
    stock = await Stock.create({ cans: 0, dispensers: 0, stands: 0 });
    stock = await Stock.findOne().lean();
  }

  return NextResponse.json(stock);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { cans?: number; dispensers?: number; stands?: number };

  const cans = body.cans !== undefined ? Math.floor(Number(body.cans)) : undefined;
  const dispensers = body.dispensers !== undefined ? Math.floor(Number(body.dispensers)) : undefined;
  const stands = body.stands !== undefined ? Math.floor(Number(body.stands)) : undefined;

  if (cans !== undefined && (!Number.isFinite(cans) || cans < 0)) {
    return NextResponse.json({ error: "Cans must be a non-negative number." }, { status: 400 });
  }
  if (dispensers !== undefined && (!Number.isFinite(dispensers) || dispensers < 0)) {
    return NextResponse.json({ error: "Dispensers must be a non-negative number." }, { status: 400 });
  }
  if (stands !== undefined && (!Number.isFinite(stands) || stands < 0)) {
    return NextResponse.json({ error: "Stands must be a non-negative number." }, { status: 400 });
  }

  const updatedBy =
    session.user.role === "admin" ? "Admin" : (session.user.name ?? "Driver");

  const setPayload: {
    cans?: number;
    dispensers?: number;
    stands?: number;
    updatedBy: string;
  } = { updatedBy };
  if (cans !== undefined) setPayload.cans = cans;
  if (dispensers !== undefined) setPayload.dispensers = dispensers;
  if (stands !== undefined) setPayload.stands = stands;

  await connectToDatabase();

  const updated = await Stock.findOneAndUpdate(
    {},
    { $set: setPayload },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(updated);
}
