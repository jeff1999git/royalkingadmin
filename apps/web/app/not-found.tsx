import Link from "next/link";

export default function NotFound() {
    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", background: "var(--bg-secondary)", padding: "1rem",
        }}>
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
                <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1, marginBottom: "1rem" }}>
                    404
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    Page not found
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                    The page you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link href="/" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", textDecoration: "none", display: "inline-block" }}>
                    Go home
                </Link>
            </div>
        </div>
    );
}
