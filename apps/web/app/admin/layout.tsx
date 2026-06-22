"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { type ReactNode } from "react";

const navItems = [
    {
        href: "/admin/amounts",
        label: "Amounts",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v10" />
                <path d="M9 10h6" />
                <path d="M9 14h6" />
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
    {
        href: "/admin/drivers",
        label: "Drivers",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        href: "/admin/vehicles",
        label: "Vehicles",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="8" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="7.5" cy="19" r="1" />
                <circle cx="16.5" cy="19" r="1" />
            </svg>
        ),
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleSignOut() {
        await signOut({ redirect: false });
        router.push("/");
    }

    // --- Reusable Navigation Link Component ---
    const NavLinks = ({ isBottomNav = false }: { isBottomNav?: boolean }) => (
        <>
            {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={isBottomNav ? {
                            // Instagram Style Bottom Tabs
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.2rem",
                            flex: 1, padding: "0.5rem 0",
                            color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                            transition: "color 0.2s",
                        } : {
                            // Desktop Top Nav
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

            {/* 
        ========================================
        TOP NAVIGATION BAR (Brand & Logout)
        ========================================
       */}
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
                {/* Brand Logo - Aligned Left */}
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

                {/* Desktop Nav Links - Centered */}
                <nav className="desktop-nav" style={{ display: "flex", gap: "0.5rem" }}>
                    <NavLinks />
                </nav>

                {/* Desktop Sign Out & Mobile Sign Out Icon - Aligned Right */}
                <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                        onClick={handleSignOut}
                        className="desktop-nav"
                        style={{
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                            color: "#ffffff", padding: "0.5rem 0.85rem", borderRadius: "6px",
                            fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>

                    {/* Minimal Sign Out Icon for Mobile Top Header */}
                    <button
                        onClick={handleSignOut}
                        className="mobile-only-flex"
                        style={{
                            background: "transparent", border: "none", color: "#ffffff", padding: "0.5rem", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                        aria-label="Sign Out"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* 
        ========================================
        MAIN CONTENT AREA
        ========================================
       */}
            <main className="content-area" style={{ flex: 1, padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", paddingBottom: "80px" }}>
                {/*
          Global responsive layout styles.
          Using a CSS style block guarantees the correct layout shifts between 
          the top/desktop nav and the bottom/mobile nav.
        */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          .desktop-nav { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
          .mobile-only-flex { display: none !important; }
          
          @media (max-width: 860px) {
            .desktop-nav { display: none !important; }
            .mobile-bottom-nav { display: flex !important; }
            .mobile-only-flex { display: flex !important; }
            .content-area { padding-bottom: 90px !important; } /* extra padding for bottom bar */
          }
        `}} />
                {children}
            </main>

            {/* 
        ========================================
        MOBILE BOTTOM TAB BAR (Instagram Style)
        ========================================
       */}
            <nav className="mobile-bottom-nav" style={{
                position: "fixed",
                bottom: 0, left: 0, right: 0,
                background: "#ffffff",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                padding: "0.5rem 0",
                paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", /* accounts for iPhone home indicator */
                zIndex: 100,
                boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            }}>
                <NavLinks isBottomNav={true} />
            </nav>

        </div>
    );
}
