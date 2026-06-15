import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function GET() {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not initialized.");
    }

    await db.command({ ping: 1 });

    return NextResponse.json(
      { ok: true, message: "MongoDB Atlas connection successful." },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error.";

    return NextResponse.json(
      { ok: false, message: "MongoDB Atlas connection failed.", error: message },
      { status: 500 }
    );
  }
}
