"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", background: "var(--bg-secondary)", padding: "1rem",
        }}>
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    Something went wrong
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                    {error.message || "An unexpected error occurred."}
                </p>
                <button onClick={reset} className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
                    Try again
                </button>
            </div>
        </div>
    );
}
