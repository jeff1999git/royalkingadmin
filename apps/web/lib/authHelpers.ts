import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: "admin" | "driver";
};

export async function getServerUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** The signed-in admin, or null. Routes answer null with unauthorized() from lib/api.ts. */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getServerUser();
  return user && user.role === "admin" ? user : null;
}

/** The signed-in driver, or null. A driver deactivated since sign-in also reads as null (see lib/auth.ts). */
export async function requireDriver(): Promise<SessionUser | null> {
  const user = await getServerUser();
  return user && user.role === "driver" ? user : null;
}
