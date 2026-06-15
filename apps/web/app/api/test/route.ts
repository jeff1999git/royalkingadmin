import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json(
      { ok: true, message: "Database connected successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      { ok: false, message: "Database connection failed", error: message },
      { status: 500 }
    );
  }
}