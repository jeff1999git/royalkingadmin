"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

const navItems = [
    {
        href: "/admin/amounts",
        label: "Analytics",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="12" width="4" height="9" rx="1" />
                <rect x="9" y="7" width="4" height="14" rx="1" />
                <rect x="16" y="3" width="4" height="18" rx="1" />
            </svg>
        ),
    },
    {
        href: "/admin/supplies",
        label: "Deliveries",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18" />
            </svg>
        ),
    },
    {
        href: "/admin/customers",
        label: "Customers",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    async function handleSignOut() {
        await signOut({ redirect: false });
        router.push("/");
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!profileOpen) return;
        function onMouseDown(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [profileOpen]);

    // Close dropdown on route change
    useEffect(() => {
        setProfileOpen(false);
    }, [pathname]);

    const adminName = session?.user?.name ?? "Admin";

    const NavLinks = ({ isBottomNav = false }: { isBottomNav?: boolean }) => (
        <>
            {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={isBottomNav ? {
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.2rem",
                            flex: 1, padding: "0.5rem 0",
                            color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                            transition: "color 0.2s",
                        } : {
                            display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.8rem", borderRadius: "6px",
                            color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
                            background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                            fontWeight: isActive ? 700 : 500, fontSize: "0.95rem", transition: "all 0.2s",
                        }}
                    >
                        {item.icon}
                        {isBottomNav && <span style={{ fontSize: "0.65rem", fontWeight: isActive ? 700 : 500 }}>{item.label}</span>}
                        {!isBottomNav && item.label}
                    </Link>
                );
            })}
        </>
    );

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-secondary)", display: "flex", flexDirection: "column" }}>

            <header style={{
                background: "var(--accent-primary)",
                color: "#ffffff",
                height: "65px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 1.5rem",
                position: "sticky",
                top: 0,
                zIndex: 100,
                boxShadow: "0 2px 8px rgba(10, 61, 145, 0.15)",
            }}>
                {/* Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div style={{
                        width: "36px", height: "36px", borderRadius: "10px", background: "#ffffff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round">
                            <path d="M12 2C6 2 2 7 2 12s4 10 10 10 10-4.5 10-10C22 7 18 2 12 2z" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>Royal King</div>
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Admin</div>
                    </div>
                </div>

                {/* Desktop Nav Links */}
                <nav className="desktop-nav" style={{ display: "flex", gap: "0.5rem" }}>
                    <NavLinks />
                </nav>

                {/* Profile circle — always visible on all screen sizes */}
                <div ref={profileRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <button
                        onClick={() => setProfileOpen(v => !v)}
                        aria-label="Account menu"
                        style={{
                            width: "38px", height: "38px", borderRadius: "50%",
                            background: profileOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.18)",
                            border: `2px solid ${profileOpen ? "#fff" : "rgba(255,255,255,0.45)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", transition: "all 0.18s", color: "#fff", flexShrink: 0,
                        }}
                    >
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>

                    {/* Dropdown menu */}
                    {profileOpen && (
                        <div style={{
                            position: "absolute",
                            top: "calc(100% + 10px)",
                            right: 0,
                            zIndex: 200,
                            background: "#fff",
                            borderRadius: "14px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.07)",
                            minWidth: "210px",
                            overflow: "hidden",
                        }}>
                            {/* Profile header */}
                            <div style={{
                                padding: "1rem 1.1rem 0.9rem",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex", alignItems: "center", gap: "0.65rem",
                            }}>
                                <div style={{
                                    width: "36px", height: "36px", borderRadius: "50%",
                                    background: "var(--accent-primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                                        {adminName}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                                        Administrator
                                    </div>
                                </div>
                            </div>

                            {/* Drivers */}
                            <Link
                                href="/admin/drivers"
                                style={{
                                    display: "flex", alignItems: "center", gap: "0.65rem",
                                    padding: "0.72rem 1.1rem",
                                    color: pathname === "/admin/drivers" ? "var(--accent-primary)" : "var(--text-secondary)",
                                    fontWeight: 600, fontSize: "0.9rem", textDecoration: "none",
                                    background: pathname === "/admin/drivers" ? "#eff6ff" : "transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Drivers
                            </Link>

                            {/* Vehicles */}
                            <Link
                                href="/admin/vehicles"
                                style={{
                                    display: "flex", alignItems: "center", gap: "0.65rem",
                                    padding: "0.72rem 1.1rem",
                                    color: pathname === "/admin/vehicles" ? "var(--accent-primary)" : "var(--text-secondary)",
                                    fontWeight: 600, fontSize: "0.9rem", textDecoration: "none",
                                    background: pathname === "/admin/vehicles" ? "#eff6ff" : "transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="3" y="11" width="18" height="8" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    <circle cx="7.5" cy="19" r="1" />
                                    <circle cx="16.5" cy="19" r="1" />
                                </svg>
                                Vehicles
                            </Link>

                            {/* Divider */}
                            <div style={{ height: "1px", background: "#f1f5f9", margin: "0.2rem 0" }} />

                            {/* Sign Out */}
                            <button
                                onClick={handleSignOut}
                                style={{
                                    display: "flex", alignItems: "center", gap: "0.65rem",
                                    padding: "0.72rem 1.1rem",
                                    width: "100%", border: "none", background: "transparent",
                                    color: "#ef4444", fontWeight: 700, fontSize: "0.9rem",
                                    cursor: "pointer", textAlign: "left",
                                    transition: "background 0.15s",
                                }}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

            <main className="content-area" style={{ flex: 1, padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", paddingBottom: "80px" }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
          .desktop-nav { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }

          @media (max-width: 860px) {
            .desktop-nav { display: none !important; }
            .mobile-bottom-nav { display: flex !important; }
            .content-area { padding-bottom: 90px !important; }
          }
        `}} />
                {children}
            </main>

            {/* Mobile Bottom Tab Bar */}
            <nav className="mobile-bottom-nav" style={{
                position: "fixed",
                bottom: 0, left: 0, right: 0,
                background: "#ffffff",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                padding: "0.5rem 0",
                paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
                zIndex: 100,
                boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            }}>
                <NavLinks isBottomNav={true} />
            </nav>

        </div>
    );
}
