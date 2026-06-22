"use client";

import { useEffect } from "react";

export default function DriverError({
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
            minHeight: "60vh", display: "flex", alignItems: "center",
            justifyContent: "center", padding: "2rem",
        }}>
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    Page error
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                    {error.message || "Something went wrong loading this page."}
                </p>
                <button onClick={reset} className="btn btn-primary" style={{ padding: "0.65rem 1.25rem" }}>
                    Retry
                </button>
            </div>
        </div>
    );
}
