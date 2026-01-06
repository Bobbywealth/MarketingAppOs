import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const DEFAULT_RECURRENCE_TZ = "America/New_York";

export type RecurrencePattern = "daily" | "weekly" | "monthly" | "yearly";
export type ScheduleFrom = "due_date" | "completion_date";

/**
 * Return YYYY-MM-DD for the given instant in the desired timezone.
 */
export function getDateKeyInTimeZone(date: Date, timeZone: string = DEFAULT_RECURRENCE_TZ): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

/**
 * Compute the next instance date key (YYYY-MM-DD) for a recurrence in a timezone.
 * Uses a "noon anchor" to avoid DST edge cases (noon always exists).
 */
export function getNextInstanceDateKey(params: {
  pattern: RecurrencePattern;
  interval: number;
  baseDate: Date;
  timeZone?: string;
}): string {
  const timeZone = params.timeZone ?? DEFAULT_RECURRENCE_TZ;
  const baseKey = getDateKeyInTimeZone(params.baseDate, timeZone);

  // Anchor at noon in tz, then add interval using date-fns on the UTC instant.
  const baseNoonUtc = fromZonedTime(`${baseKey}T12:00:00`, timeZone);
  let nextNoonUtc: Date;
  const interval = Math.max(1, Number(params.interval || 1));

  switch (params.pattern) {
    case "weekly":
      nextNoonUtc = addWeeks(baseNoonUtc, interval);
      break;
    case "monthly":
      nextNoonUtc = addMonths(baseNoonUtc, interval);
      break;
    case "yearly":
      nextNoonUtc = addYears(baseNoonUtc, interval);
      break;
    case "daily":
    default:
      nextNoonUtc = addDays(baseNoonUtc, interval);
      break;
  }

  return getDateKeyInTimeZone(nextNoonUtc, timeZone);
}

/**
 * Convert a YYYY-MM-DD instance date key into an end-of-day UTC Date in the given timezone.
 */
export function getEndOfDayUtcFromDateKey(dateKey: string, timeZone: string = DEFAULT_RECURRENCE_TZ): Date {
  // 23:59:59.999 local time
  return fromZonedTime(`${dateKey}T23:59:59.999`, timeZone);
}


