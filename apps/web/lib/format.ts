// Display formatting shared by the admin and driver screens.
//
// Business days are IST days (see lib/istTime.ts), so every date shown to a
// user is rendered in IST no matter what timezone the phone or laptop is set
// to. The formatters are created once; Intl objects are expensive to build.

import { IST_OFFSET_MS } from "./istTime";

export const IST_TIME_ZONE = "Asia/Kolkata";

const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: IST_TIME_ZONE,
});

const shortDateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: IST_TIME_ZONE,
});

const shortDateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: IST_TIME_ZONE,
});

const dateHeadingFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: IST_TIME_ZONE,
});

const numberFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function toDate(value: string | number | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "23/09/2026, 02:05 pm" in IST. */
export function formatDateTime(value: string | number | Date): string {
  const d = toDate(value);
  return d ? dateTimeFormat.format(d) : "";
}

/** "23 Sept 2026, 2:05 pm" in IST. */
export function formatShortDateTime(value: string | number | Date): string {
  const d = toDate(value);
  return d ? shortDateTimeFormat.format(d) : "";
}

/** "23 Sept 2026" in IST. */
export function formatShortDate(value: string | number | Date): string {
  const d = toDate(value);
  return d ? shortDateFormat.format(d) : "";
}

/** "23 September 2026" in IST. */
export function formatDateHeading(value: string | number | Date): string {
  const d = toDate(value);
  return d ? dateHeadingFormat.format(d) : "";
}

/** The IST calendar day of an instant, as "YYYY-MM-DD". Use it for grouping and for <input type="date"> values. */
export function istDayKey(value: string | number | Date): string {
  const d = toDate(value);
  return d ? new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10) : "";
}

/** Today's IST day as "YYYY-MM-DD". */
export function istToday(): string {
  return istDayKey(Date.now());
}

/** "Today", "Yesterday" or the full IST date heading. */
export function relativeDayLabel(value: string | number | Date): string {
  const key = istDayKey(value);
  if (!key) return "";
  const todayKey = istToday();
  if (key === todayKey) return "Today";
  const yesterday = new Date(`${todayKey}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (key === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return formatDateHeading(value);
}

/** "1,234.5" with Indian digit grouping and at most two decimals. */
export function formatNumber(value: number | null | undefined): string {
  return numberFormat.format(Number.isFinite(value as number) ? (value as number) : 0);
}

/** "₹1,234.5". */
export function formatMoney(value: number | null | undefined): string {
  return `₹${formatNumber(value)}`;
}

/** Rounds money to paise, avoiding float artefacts such as 30.299999999999997. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
