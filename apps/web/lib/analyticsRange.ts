import { istDateRange, istTodayString } from "./istTime";

export type AnalyticsRange = {
  /** First IST day in the window, "YYYY-MM-DD" (inclusive). */
  fromDay: string;
  /** Last IST day in the window, "YYYY-MM-DD" (inclusive). */
  toDay: string;
  /** Start of fromDay in IST, as a UTC instant. */
  start: Date;
  /** Last millisecond of toDay in IST, as a UTC instant. */
  end: Date;
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Resolves the analytics date window from the query string:
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD  inclusive IST days, or otherwise
//   ?days=N                          last N IST days ending today (7-90, default 30).
// Shared by the analytics charts and the new-customers list so the
// "New Customers" number and the list behind it always agree.
// Returns null when a date can't be parsed (e.g. month 13). Like the rest of
// the app's date handling, an overflowing day such as 2026-02-30 rolls over
// into the next month rather than being rejected.
export function resolveAnalyticsRange(params: URLSearchParams): AnalyticsRange | null {
  const fromParam = params.get("from");
  const toParam = params.get("to");

  let fromDay: string;
  let toDay: string;
  if (fromParam && toParam && DAY_RE.test(fromParam) && DAY_RE.test(toParam) && fromParam <= toParam) {
    fromDay = fromParam;
    toDay = toParam;
  } else {
    const days = Math.min(90, Math.max(7, Number.parseInt(params.get("days") ?? "30", 10) || 30));
    toDay = istTodayString();
    const first = new Date(`${toDay}T00:00:00.000Z`);
    first.setUTCDate(first.getUTCDate() - days + 1);
    fromDay = first.toISOString().slice(0, 10);
  }

  const startDay = istDateRange(fromDay);
  const endDay = istDateRange(toDay);
  if (!startDay || !endDay) return null;
  return { fromDay, toDay, start: startDay.start, end: endDay.end };
}

// Which customers count as "new" in a window: those created in it.
// Soft-deleted customers still count, because they were new at the time.
// A customer isn't tied to a driver or vehicle, so those filters don't apply.
export function newCustomerMatch(range: AnalyticsRange) {
  return { createdAt: { $gte: range.start, $lte: range.end } };
}
