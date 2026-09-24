"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatShortDateTime } from "../../lib/format";
import { useEscapeKey } from "../hooks/useEscapeKey";

type StockValues = { cans: number; dispensers: number; stands: number };
type StockResponse = Partial<StockValues> & { updatedBy?: string | null; updatedAt?: string | null; error?: string };

const EMPTY: StockValues = { cans: 0, dispensers: 0, stands: 0 };
const FIELDS = ["cans", "dispensers", "stands"] as const;

// The shared Stock dialog used by the admin and driver layouts. Render it only
// while open; it loads the current counts on mount. Save stays disabled until
// a load has succeeded, so a failed load can never overwrite the real counts
// with zeros.
export default function StockModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [values, setValues] = useState<StockValues>(EMPTY);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEscapeKey(onClose);

  const applyResponse = useCallback((data: StockResponse) => {
    setValues({ cans: data.cans ?? 0, dispensers: data.dispensers ?? 0, stands: data.stands ?? 0 });
    setUpdatedBy(data.updatedBy ?? null);
    setUpdatedAt(data.updatedAt ?? null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stock", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as StockResponse;
      if (!res.ok) {
        setError(data.error ?? "Failed to load stock.");
        return;
      }
      applyResponse(data);
      setLoaded(true);
    } catch {
      setError("Failed to load stock. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    void load();
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, [load]);

  async function save() {
    if (!loaded) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as StockResponse;
      if (!res.ok) {
        setError(data.error ?? "Failed to save stock.");
        return;
      }
      applyResponse(data);
      setSuccess("Stock updated.");
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(""), 2500);
    } catch {
      setError("Failed to save stock. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  function adjust(key: keyof StockValues, delta: number) {
    setValues((v) => ({ ...v, [key]: Math.max(0, v[key] + delta) }));
  }

  return (
    <div
      role="presentation"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 300 }}
      onClick={onClose}
    >
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-dialog-title"
        style={{ width: "100%", maxWidth: "360px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 id="stock-dialog-title" style={{ margin: 0 }}>Stock</h3>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose} autoFocus>
            Close
          </button>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1rem 0" }}>Loading...</div>
        ) : !loaded ? (
          <>
            <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>{error || "Failed to load stock."}</div>
            <button type="button" className="btn btn-secondary btn-full" onClick={() => void load()}>
              Try Again
            </button>
          </>
        ) : (
          <>
            {FIELDS.map((key) => (
              <div key={key} style={{ marginBottom: "1rem" }}>
                <label className="form-label" htmlFor={`stock-${key}`} style={{ marginBottom: "0.4rem", textTransform: "capitalize", display: "block" }}>{key}</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    aria-label={`Decrease ${key}`}
                    style={{ width: "36px", flexShrink: 0 }}
                    onClick={() => adjust(key, -1)}
                  >
                    –
                  </button>
                  <input
                    id={`stock-${key}`}
                    className="form-input"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={values[key]}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setValues((v) => ({ ...v, [key]: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) }));
                    }}
                    style={{ textAlign: "center", width: "80px" }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    aria-label={`Increase ${key}`}
                    style={{ width: "36px", flexShrink: 0 }}
                    onClick={() => adjust(key, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            {updatedAt && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Last updated: {formatShortDateTime(updatedAt)}
                {updatedBy ? ` · by ${updatedBy}` : ""}
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: "0.75rem" }}>{success}</div>}

            <button type="button" className="btn btn-primary btn-full" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
