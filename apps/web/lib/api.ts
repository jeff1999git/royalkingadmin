// Small helpers shared by every API route: JSON responses in the one shape
// the clients read ({ error }), safe body parsing, and input coercion.

import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return jsonError("Unauthorized", 401);
}

export function badRequest(message: string) {
  return jsonError(message, 400);
}

export function notFound(message = "Not found") {
  return jsonError(message, 404);
}

/** Logs the real error on the server and answers with a generic message, so internals never reach the client. */
export function serverError(error: unknown, message = "Something went wrong. Please try again.") {
  console.error(message, error);
  return jsonError(message, 500);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses a JSON body and insists on a plain object; anything else is a 400, not a crash. */
export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return isPlainObject(body) ? body : null;
  } catch {
    return null;
  }
}

/** A trimmed string, or undefined when absent. Anything that isn't a string (an object, an array) reads as undefined so it can't reach a query. */
export function optionalString(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

/** A trimmed, non-empty string, or undefined. */
export function requiredString(value: unknown, maxLength = 500): string | undefined {
  const s = optionalString(value, maxLength);
  return s ? s : undefined;
}

/** A finite number from a number or numeric string, or undefined. */
export function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
