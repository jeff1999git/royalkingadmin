// Business days are IST days. The server may run in any timezone (usually
// UTC), so every "day" boundary used in queries is computed against the
// fixed IST offset instead of the server's local clock. IST has no DST,
// which makes the fixed offset safe.

export const IST_OFFSET_MS = 330 * 60 * 1000; // +05:30

// Start of the IST day containing `d`, as a UTC instant.
export function istDayStart(d: Date = new Date()): Date {
  const shifted = new Date(d.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

// End of the IST day containing `d` (last millisecond), as a UTC instant.
export function istDayEnd(d: Date = new Date()): Date {
  return new Date(istDayStart(d).getTime() + 24 * 60 * 60 * 1000 - 1);
}

// "YYYY-MM-DD" → { start, end } spanning that IST day, or null if invalid.
export function istDateRange(dateStr: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const utcMidnight = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(utcMidnight.getTime())) return null;
  const start = new Date(utcMidnight.getTime() - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

// Calendar month (1-12) → { start, end } spanning that IST month.
export function istMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(year, month, 1) - IST_OFFSET_MS - 1);
  return { start, end };
}

// Today's date in IST as "YYYY-MM-DD".
export function istTodayString(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// The IST calendar day containing `d`, as "YYYY-MM-DD".
export function istDayString(d: Date = new Date()): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// A delivery time sent by a client. A full ISO string is taken as is. A
// date-only "YYYY-MM-DD" (the admin's Add dialog) means that IST day: now
// when it is today, otherwise 12:00 IST so the row sorts inside the day rather
// than at 05:30 (UTC midnight). Returns null when the value can't be read.
export function parseSuppliedAtInput(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const range = istDateRange(text);
    if (!range) return null;
    if (text === istDayString()) return new Date();
    return new Date(range.start.getTime() + 12 * 60 * 60 * 1000);
  }
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}
