"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export default function DriverLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Odometer state
    const [odometerChecking, setOdometerChecking] = useState(true);
    const [odometerRequired, setOdometerRequired] = useState(false); // blocking daily gate
    const [odometerOpen, setOdometerOpen] = useState(false);         // user-triggered from dropdown
    const [odometerValue, setOdometerValue] = useState("");
    const [odometerSubmitting, setOdometerSubmitting] = useState(false);
    const [odometerError, setOdometerError] = useState("");
    const [odometerSuccess, setOdometerSuccess] = useState("");
    const [odometerHistory, setOdometerHistory] = useState<{ reading: number; recordedAt: string }[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [odometerFilledToday, setOdometerFilledToday] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const driverName = session?.user?.name ?? "";
    const initial = driverName.charAt(0).toUpperCase() || "D";

    // Check if odometer was filled today, once session is ready
    useEffect(() => {
        if (status !== "authenticated") return;

        void (async () => {
            try {
                const res = await fetch("/api/driver/vehicles/odometer", { cache: "no-store" });
                if (res.ok) {
                    const data = (await res.json()) as { filledToday: boolean };
                    if (!data.filledToday) {
                        setOdometerRequired(true);
                    }
                }
            } catch {
                // silently ignore — don't block the driver on network error
            } finally {
                setOdometerChecking(false);
            }
        })();
    }, [status]);

    // Close dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    async function handleSignOut() {
        await signOut({ redirect: false });
        router.push("/");
    }

    async function handleOdometerSubmit(e: FormEvent) {
        e.preventDefault();
        setOdometerError("");
        setOdometerSuccess("");
        setOdometerSubmitting(true);

        const res = await fetch("/api/driver/vehicles/odometer", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ odometer: Number(odometerValue) }),
        });

        let data: { error?: string } = {};
        try { data = (await res.json()) as { error?: string }; } catch { /* ignore */ }
        setOdometerSubmitting(false);

        if (!res.ok) {
            setOdometerError(data.error ?? "Failed to update odometer.");
            return;
        }

        // Dismiss whichever modal is open
        setOdometerRequired(false);
        setOdometerOpen(false);
        setOdometerValue("");
        setOdometerSuccess("");
    }

    const showOdometerModal = odometerRequired || odometerOpen;
    const isBlocking = odometerRequired; // can't close when blocking

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
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
                            Driver Portal{driverName ? ` - ${driverName}` : ""}
                        </div>
                    </div>
                </div>

                {/* Profile circle + dropdown */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen((o) => !o)}
                        style={{
                            width: "40px", height: "40px", borderRadius: "50%",
                            background: "#ffffff", color: "var(--accent-primary)",
                            border: "2px solid rgba(255,255,255,0.4)",
                            fontWeight: 800, fontSize: "1.1rem",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}
                        aria-label="Profile menu"
                    >
                        {initial}
                    </button>

                    {dropdownOpen && (
                        <div style={{
                            position: "absolute", top: "calc(100% + 8px)", right: 0,
                            background: "#ffffff", border: "1px solid var(--border)",
                            borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                            minWidth: "170px", zIndex: 200, overflow: "hidden",
                        }}>
                            {/* Driver name header */}
                            <div style={{
                                padding: "0.75rem 1rem",
                                borderBottom: "1px solid var(--border)",
                                display: "flex", alignItems: "center", gap: "0.6rem",
                            }}>
                                <div style={{
                                    width: "30px", height: "30px", borderRadius: "50%",
                                    background: "var(--accent-primary)", color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 800, fontSize: "0.95rem", flexShrink: 0,
                                }}>
                                    {initial}
                                </div>
                                <div style={{
                                    fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)",
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}>
                                    {driverName || "Driver"}
                                </div>
                            </div>

                            {/* Odometer option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    setOdometerError("");
                                    setOdometerSuccess("");
                                    setOdometerHistory([]);
                                    setOdometerOpen(true);
                                    setHistoryLoading(true);
                                    void fetch("/api/driver/vehicles/odometer", { cache: "no-store" })
                                        .then((r) => r.json())
                                        .then((d: { filledToday?: boolean; history?: { reading: number; recordedAt: string }[] }) => {
                                            setOdometerFilledToday(d.filledToday ?? false);
                                            setOdometerHistory(d.history ?? []);
                                        })
                                        .finally(() => setHistoryLoading(false));
                                }}
                                style={{
                                    display: "flex", alignItems: "center", gap: "0.6rem",
                                    width: "100%", padding: "0.7rem 1rem",
                                    border: "none", borderBottom: "1px solid var(--border)",
                                    background: "transparent", cursor: "pointer",
                                    fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)",
                                    textAlign: "left",
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4l3 3" />
                                </svg>
                                Odometer
                            </button>

                            {/* Sign out option */}
                            <button
                                type="button"
                                onClick={() => { setDropdownOpen(false); void handleSignOut(); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: "0.6rem",
                                    width: "100%", padding: "0.7rem 1rem",
                                    border: "none",
                                    background: "transparent", cursor: "pointer",
                                    fontSize: "0.88rem", fontWeight: 600, color: "#b91c1c",
                                    textAlign: "left",
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main content — blurred/blocked until odometer check done */}
            <main style={{
                padding: "1.5rem", maxWidth: "100%", margin: "0 auto",
                ...(odometerChecking || odometerRequired
                    ? { filter: "blur(3px)", pointerEvents: "none", userSelect: "none" }
                    : {}),
            }}>
                {children}
            </main>

            {/* Odometer modal */}
            {showOdometerModal && (
                <div
                    style={{
                        position: "fixed", inset: 0,
                        background: isBlocking ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "1rem", zIndex: 300,
                    }}
                    onClick={isBlocking ? undefined : () => { setOdometerOpen(false); setOdometerError(""); setOdometerSuccess(""); }}
                >
                    <div
                        className="card"
                        style={{ width: "100%", maxWidth: "380px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: "1.25rem" }}>
                            <div className="flex items-center justify-between">
                                <h3 style={{ margin: 0 }}>
                                    {isBlocking ? "Today's Odometer Reading" : "Update Odometer"}
                                </h3>
                                {!isBlocking && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => { setOdometerOpen(false); setOdometerError(""); setOdometerSuccess(""); }}
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                            {isBlocking && (
                                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.4rem", marginBottom: 0 }}>
                                    Please enter today&apos;s odometer reading to continue.
                                </p>
                            )}
                        </div>

                        {/* Past entries — only shown in voluntary modal */}
                        {!isBlocking && (
                            <>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Last 5 Entries
                                </div>
                                {historyLoading ? (
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Loading...</div>
                                ) : odometerHistory.length === 0 ? (
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>No entries yet.</div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem" }}>
                                        {odometerHistory.map((entry, i) => (
                                            <div key={i} style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "0.5rem 0.75rem",
                                                background: i === 0 && odometerFilledToday ? "#f0fdf4" : "var(--bg-secondary)",
                                                borderRadius: "8px",
                                                border: i === 0 && odometerFilledToday ? "1px solid #bbf7d0" : "1px solid transparent",
                                                fontSize: "0.85rem",
                                            }}>
                                                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                                    {entry.reading.toLocaleString()} km
                                                </span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    {i === 0 && odometerFilledToday && (
                                                        <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "0.1rem 0.45rem", borderRadius: "99px" }}>
                                                            Today
                                                        </span>
                                                    )}
                                                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                                                        {new Date(entry.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {odometerFilledToday ? (
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", padding: "0.5rem 0" }}>
                                        Already submitted for today.
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ borderTop: "1px solid var(--border)", marginBottom: "1rem" }} />
                                        <form onSubmit={(e) => void handleOdometerSubmit(e)}>
                                            <div className="form-group" style={{ marginBottom: "1rem" }}>
                                                <label className="form-label">Today&apos;s Reading (km)</label>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={odometerValue}
                                                    onChange={(e) => setOdometerValue(e.target.value)}
                                                    placeholder="e.g. 12500"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                            {odometerError && (
                                                <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>
                                                    {odometerError}
                                                </div>
                                            )}
                                            <button type="submit" className="btn btn-primary w-full" disabled={odometerSubmitting}>
                                                {odometerSubmitting ? "Submitting..." : "Submit"}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </>
                        )}

                        {/* Blocking modal form */}
                        {isBlocking && (
                            <form onSubmit={(e) => void handleOdometerSubmit(e)}>
                                <div className="form-group" style={{ marginBottom: "1rem" }}>
                                    <label className="form-label">Current Reading (km)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={odometerValue}
                                        onChange={(e) => setOdometerValue(e.target.value)}
                                        placeholder="e.g. 12500"
                                        required
                                        autoFocus
                                    />
                                </div>
                                {odometerError && (
                                    <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>
                                        {odometerError}
                                    </div>
                                )}
                                <button type="submit" className="btn btn-primary w-full" disabled={odometerSubmitting}>
                                    {odometerSubmitting ? "Submitting..." : "Submit"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
