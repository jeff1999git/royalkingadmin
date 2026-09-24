import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "./mongodb";
import User from "../models/User";

function getAdminCredentials() {
    const username = process.env.ADMIN_USERNAME?.trim() || "admin";
    const passwordFromEnv = process.env.ADMIN_PASSWORD?.trim();

    if (passwordFromEnv) {
        return { username, password: passwordFromEnv };
    }

    if (process.env.NODE_ENV !== "production") {
        return { username, password: "admin123" };
    }

    return null;
}

// Constant-time string comparison. Hashing both sides first gives equal-length
// buffers, so neither the length nor the first differing byte leaks timing.
function safeEqual(a: string, b: string) {
    const digestA = crypto.createHash("sha256").update(a).digest();
    const digestB = crypto.createHash("sha256").update(b).digest();
    return crypto.timingSafeEqual(digestA, digestB);
}

// In-memory, per-instance failed-login throttle: after MAX_FAILURES within
// the window a username+ip pair is refused without checking the password.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const MAX_CREDENTIAL_LENGTH = 200;
const loginFailures = new Map<string, { count: number; first: number }>();

function loginThrottleKey(username: string, headers: Record<string, unknown> | undefined) {
    const forwarded = headers?.["x-forwarded-for"];
    const ip = typeof forwarded === "string" && forwarded.trim()
        ? forwarded.split(",")[0]!.trim()
        : "local";
    return `${username}|${ip}`;
}

function isLoginThrottled(key: string) {
    const entry = loginFailures.get(key);
    if (!entry) return false;
    if (Date.now() - entry.first >= LOGIN_WINDOW_MS) {
        loginFailures.delete(key);
        return false;
    }
    return entry.count >= MAX_FAILURES;
}

function recordLoginFailure(key: string) {
    const now = Date.now();
    if (loginFailures.size > 1000) {
        for (const [k, v] of loginFailures) {
            if (now - v.first >= LOGIN_WINDOW_MS) loginFailures.delete(k);
        }
    }
    const entry = loginFailures.get(key);
    if (entry && now - entry.first < LOGIN_WINDOW_MS) {
        entry.count += 1;
    } else {
        loginFailures.set(key, { count: 1, first: now });
    }
}

// A driver deactivated (or deleted) after signing in must lose access without
// waiting for the JWT to expire. Re-checked at most once a minute per driver.
const DRIVER_ACTIVE_TTL_MS = 60 * 1000;
const driverActiveCache = new Map<string, { ok: boolean; at: number }>();

async function isDriverActive(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const now = Date.now();
    const cached = driverActiveCache.get(id);
    if (cached && now - cached.at < DRIVER_ACTIVE_TTL_MS) return cached.ok;
    try {
        await connectToDatabase();
        const ok = Boolean(await User.exists({ _id: id, role: "driver", isActive: true }));
        driverActiveCache.set(id, { ok, at: now });
        return ok;
    } catch (err) {
        // A DB blip must never lock every driver out; fall back to the last answer.
        console.error("[auth] driver active check failed", err);
        return cached ? cached.ok : true;
    }
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            username: string;
            role: "admin" | "driver";
        };
    }
    interface User {
        id: string;
        name: string;
        username: string;
        role: "admin" | "driver";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        role: "admin" | "driver";
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                // next-auth passes the JSON body through verbatim, so insist on
                // plain strings before anything reaches a query.
                const username = credentials?.username;
                const password = credentials?.password;
                if (
                    typeof username !== "string" ||
                    typeof password !== "string" ||
                    !username ||
                    !password ||
                    username.length > MAX_CREDENTIAL_LENGTH ||
                    password.length > MAX_CREDENTIAL_LENGTH
                ) {
                    return null;
                }

                const throttleKey = loginThrottleKey(username, req?.headers);
                if (isLoginThrottled(throttleKey)) return null;

                const adminCredentials = getAdminCredentials();

                if (
                    adminCredentials &&
                    safeEqual(username, adminCredentials.username) &&
                    safeEqual(password, adminCredentials.password)
                ) {
                    loginFailures.delete(throttleKey);
                    return {
                        id: "admin",
                        name: "Administrator",
                        username: "admin",
                        role: "admin",
                    };
                }

                // Driver DB check
                await connectToDatabase();
                const user = await User.findOne({
                    username,
                    role: "driver",
                    isActive: true,
                });

                if (!user) {
                    recordLoginFailure(throttleKey);
                    return null;
                }

                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password
                );
                if (!passwordMatch) {
                    recordLoginFailure(throttleKey);
                    return null;
                }

                loginFailures.delete(throttleKey);
                return {
                    id: user._id.toString(),
                    name: user.name,
                    username: user.username,
                    role: "driver",
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.name = user.name;
            } else if (token.role === "driver" && token.id) {
                // Deactivated since sign-in: drop the role so proxy.ts sends the
                // driver to /login and every role check answers 401.
                if (!(await isDriverActive(token.id))) {
                    const stripped = token as Record<string, unknown>;
                    delete stripped.role;
                    delete stripped.id;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.role = token.role;
                session.user.name = token.name as string;
                if (!token.role) {
                    // No role on the token (deactivated driver): the client sees none either.
                    (session.user as { role?: "admin" | "driver" }).role = undefined;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
