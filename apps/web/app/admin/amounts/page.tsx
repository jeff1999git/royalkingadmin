"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface DailyDelivery {
  date: string;
  count: number;
  totalCans: number;
}

interface DailyRegistration {
  date: string;
  count: number;
}

interface AnalyticsData {
  deliveries: DailyDelivery[];
  registrations: DailyRegistration[];
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color,
  gradientId,
}: {
  data: Array<{ date: string; value: number }>;
  color: string;
  gradientId: string;
}) {
  const W = 580;
  const H = 170;
  const PL = 38;
  const PR = 8;
  const PT = 14;
  const PB = 30;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const slotW = chartW / n;
  const barW = Math.max(2, slotW * 0.65);

  const yTicks = useMemo(() => {
    const nice = Math.ceil(maxVal / 4) * 4;
    return [0, Math.round(nice / 2), nice];
  }, [maxVal]);

  const interval = n <= 7 ? 1 : n <= 14 ? 2 : 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {yTicks.map((tick) => {
        const y = PT + chartH - (tick / Math.max(...yTicks, 1)) * chartH;
        return (
          <g key={tick}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 5} y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">
              {tick}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(0, (d.value / Math.max(...yTicks, 1)) * chartH);
        const x = PL + i * slotW + (slotW - barW) / 2;
        const y = PT + chartH - barH;
        return (
          <rect
            key={d.date}
            x={x}
            y={y}
            width={barW}
            height={barH}
            fill={`url(#${gradientId})`}
            rx="2"
          />
        );
      })}

      {/* X axis labels */}
      {data.map((d, i) => {
        if (i % interval !== 0 && i !== n - 1) return null;
        const x = PL + i * slotW + slotW / 2;
        return (
          <text key={d.date} x={x} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#94a3b8">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({
  data,
  color,
  gradientId,
}: {
  data: Array<{ date: string; value: number }>;
  color: string;
  gradientId: string;
}) {
  const W = 580;
  const H = 170;
  const PL = 38;
  const PR = 8;
  const PT = 14;
  const PB = 30;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;

  const yTicks = useMemo(() => {
    const nice = Math.ceil(maxVal / 4) * 4;
    return [0, Math.round(nice / 2), nice];
  }, [maxVal]);

  const points = data.map((d, i) => ({
    x: PL + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW),
    y: PT + chartH - (d.value / Math.max(...yTicks, 1)) * chartH,
    date: d.date,
    value: d.value,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = last && first
    ? `${linePath} L ${last.x.toFixed(1)} ${(PT + chartH).toFixed(1)} L ${first.x.toFixed(1)} ${(PT + chartH).toFixed(1)} Z`
    : "";

  const interval = n <= 7 ? 1 : n <= 14 ? 2 : 5;
  const dotR = n <= 14 ? 3 : 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {yTicks.map((tick) => {
        const y = PT + chartH - (tick / Math.max(...yTicks, 1)) * chartH;
        return (
          <g key={tick}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 5} y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">
              {tick}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((p) => (
        <circle key={p.date} cx={p.x} cy={p.y} r={dotR} fill={color} />
      ))}

      {/* X axis labels */}
      {data.map((d, i) => {
        if (i % interval !== 0 && i !== n - 1) return null;
        const p = points[i];
        if (!p) return null;
        return (
          <text key={d.date} x={p.x} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#94a3b8">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="card"
      style={{ padding: "1rem 1.25rem", borderTop: `3px solid ${accent}` }}
    >
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
        {value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Analytics Page ─────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { label: string; days: number }[] = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (d: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${d}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load analytics.");
      const json = (await res.json()) as AnalyticsData;
      setData(json);
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(days);
  }, [days, loadAnalytics]);

  const totals = useMemo(() => {
    if (!data) return { deliveries: 0, cans: 0, customers: 0 };
    return {
      deliveries: data.deliveries.reduce((s, d) => s + d.count, 0),
      cans: data.deliveries.reduce((s, d) => s + d.totalCans, 0),
      customers: data.registrations.reduce((s, r) => s + r.count, 0),
    };
  }, [data]);

  const deliveryChartData = useMemo(
    () => (data?.deliveries ?? []).map((d) => ({ date: d.date, value: d.count })),
    [data],
  );
  const cansChartData = useMemo(
    () => (data?.deliveries ?? []).map((d) => ({ date: d.date, value: d.totalCans })),
    [data],
  );
  const registrationChartData = useMemo(
    () => (data?.registrations ?? []).map((r) => ({ date: r.date, value: r.count })),
    [data],
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <h1>Analytics</h1>
        <div
          style={{
            background: "#eef2f7",
            borderRadius: "12px",
            padding: "0.3rem",
            display: "flex",
            gap: "0.25rem",
          }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setDays(opt.days)}
              style={{
                border: 0,
                borderRadius: "9px",
                padding: "0.4rem 0.85rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                background: days === opt.days ? "var(--accent-primary)" : "transparent",
                color: days === opt.days ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* Summary stats */}
      <div className="grid-3" style={{ marginBottom: "1.25rem" }}>
        <StatCard label="Total Deliveries" value={totals.deliveries} accent="var(--accent-primary)" />
        <StatCard label="Total Cans Delivered" value={totals.cans} accent="#0ea5e9" />
        <StatCard label="New Customers" value={totals.customers} accent="#8b5cf6" />
      </div>

      {loading ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Loading analytics...
        </div>
      ) : (
        <>
          <ChartCard title="Daily Deliveries">
            <LineChart
              data={deliveryChartData}
              color="var(--accent-primary)"
              gradientId="grad-deliveries"
            />
          </ChartCard>

          <ChartCard title="Cans Delivered per Day">
            <BarChart
              data={cansChartData}
              color="#0ea5e9"
              gradientId="grad-cans"
            />
          </ChartCard>

          <ChartCard title="New Customer Registrations">
            <BarChart
              data={registrationChartData}
              color="#8b5cf6"
              gradientId="grad-registrations"
            />
          </ChartCard>
        </>
      )}
    </div>
  );
}
