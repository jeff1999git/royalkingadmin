import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                const adminCredentials = getAdminCredentials();

                if (
                    adminCredentials &&
                    credentials.username === adminCredentials.username &&
                    credentials.password === adminCredentials.password
                ) {
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
                    username: credentials.username,
                    role: "driver",
                    isActive: true,
                });

                if (!user) return null;

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );
                if (!passwordMatch) return null;

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
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.role = token.role;
                session.user.name = token.name as string;
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
