"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";

export default function DriverLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { data: session } = useSession();

    async function handleSignOut() {
        await signOut({ redirect: false });
        router.push("/");
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
            {/* Top nav - High Contrast Deep Blue */}
            <header style={{
                background: "var(--accent-primary)",
                color: "#ffffff",
                padding: "0 1.5rem",
                height: "70px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                zIndex: 100,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div style={{
                        width: "40px", height: "40px", borderRadius: "10px",
                        background: "#ffffff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3">
                            <path d="M12 2C6 2 2 7 2 12s4 10 10 10 10-4.5 10-10C22 7 18 2 12 2z" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>Royal King</div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                            Driver Portal{session?.user?.name ? ` - ${session.user.name}` : ""}
                        </div>
                    </div>
                </div>

                <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ textAlign: "right", display: "none" /* hide name on very small screens if needed, but let's show it */ }}>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{session?.user.name}</div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            style={{
                                display: "flex", alignItems: "center", gap: "0.4rem",
                                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                                color: "#ffffff", padding: "0.5rem 0.85rem", borderRadius: "6px",
                                fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </nav>
            </header>

            <main style={{ padding: "1.5rem", maxWidth: "100%", margin: "0 auto" }}>
                {children}
            </main>
        </div>
    );
}
