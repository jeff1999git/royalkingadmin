// Business days are IST days. The server may run in any timezone (usually
// UTC), so every "day" boundary used in queries is computed against the
// fixed IST offset instead of the server's local clock. IST has no DST,
// which makes the fixed offset safe.

const IST_OFFSET_MS = 330 * 60 * 1000; // +05:30

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
