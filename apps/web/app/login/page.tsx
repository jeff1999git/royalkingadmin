"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Inner form component that uses useSearchParams
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams?.get("role"); // 'admin' or 'driver'

    const { data: session, status } = useSession();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            if (session.user.role === "admin") {
                router.replace("/admin/amounts");
            } else if (session.user.role === "driver") {
                router.replace("/driver");
            }
        }
    }, [session, status, router]);

    if (status === "loading" || status === "authenticated") {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)" }}>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>Redirecting…</div>
            </div>
        );
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        setLoading(false);

        if (!res?.ok) {
            setError("Invalid username or password.");
            return;
        }

        const sessionRes = await fetch("/api/auth/session");
        const sess = await sessionRes.json() as { user?: { role: string } };

        if (sess?.user?.role === "admin") {
            router.push("/admin/amounts");
        } else if (sess?.user?.role === "driver") {
            router.push("/driver");
        } else {
            setError("Unexpected error. Please try again.");
        }
    }

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg-secondary)", padding: "1rem",
        }}>
            <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse, rgba(10, 61, 145, 0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    {/* Logo completely removed */}
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                        {role === "admin" ? "Admin Login" : role === "driver" ? "Driver Login" : "Royal King Water Supply"}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: 500 }}>
                        Sign in to your account
                    </p>
                </div>

                <div className="card" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Username</label>
                            <input id="username" type="text" className="form-input" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input id="password" type="password" className="form-input" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required />
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: "0.85rem", fontSize: "1rem", marginTop: "0.5rem" }}>
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {role !== "admin" && (
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                Driver credentials are assigned by the administrator
                            </p>
                        )}

                        {role === "admin" ? (
                            <Link href="/login?role=driver" style={{ fontSize: "0.85rem", color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
                                Not an admin? Go to Driver Login →
                            </Link>
                        ) : role === "driver" ? (
                            <Link href="/login?role=admin" style={{ fontSize: "0.85rem", color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
                                Not a driver? Go to Admin Login →
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Fallback skeleton while Suspense handles the boundary
function LoginFallback() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>Loading login…</div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginForm />
        </Suspense>
    );
}
