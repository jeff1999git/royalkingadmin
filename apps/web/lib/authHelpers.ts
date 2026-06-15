import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getServerUser() {
    const session = await getServerSession(authOptions);
    return session?.user ?? null;
}

export async function requireAdmin() {
    const user = await getServerUser();
    if (!user || user.role !== "admin") {
        throw new Error("Unauthorized");
    }
    return user;
}

export async function requireDriver() {
    const user = await getServerUser();
    if (!user || user.role !== "driver") {
        throw new Error("Unauthorized");
    }
    return user;
}
