"use client";

import { useSession } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <div style={{
      height: "100vh", // Force absolute device height
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-secondary)",
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden", // Prevent scroll strictly
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "300px", height: "300px",
        background: "radial-gradient(ellipse, rgba(10, 61, 145, 0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* Main Content Area filling the screen */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 }}>

        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "3rem", color: "var(--text-primary)", textAlign: "center" }}>
          Royal King Water Supply
        </h1>

        {/* Buttons layout */}
        <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {status === "loading" ? (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: 500, textAlign: "center", padding: "1rem" }}>Checking session…</div>
          ) : status === "authenticated" ? (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: 500, textAlign: "center", padding: "1rem" }}>Redirecting…</div>
          ) : (
            <>
              {/* Admin Row Card */}
              <Link href="/login?role=admin" style={{ display: "block", width: "100%" }}>
                <div className="card" style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem",
                  transition: "all 0.2s", cursor: "pointer", width: "100%"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                    background: "var(--accent-light)", color: "var(--accent-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Admin Portal</h3>
                </div>
              </Link>

              {/* Driver Row Card */}
              <Link href="/login?role=driver" style={{ display: "block", width: "100%" }}>
                <div className="card" style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem",
                  transition: "all 0.2s", cursor: "pointer", width: "100%"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "var(--success)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(21, 128, 61, 0.1), 0 2px 4px -1px rgba(21, 128, 61, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                    background: "var(--success-light)", color: "var(--success)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                      <polyline points="17 2 12 7 7 2" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Driver Portal</h3>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap HomePage in a Suspense boundary to prevent Next.js client-side routing exceptions on browser back
export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)" }}>
        <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
