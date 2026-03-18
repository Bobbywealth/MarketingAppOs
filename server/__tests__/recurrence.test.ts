import { describe, it, expect } from "vitest";
import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_RECURRENCE_TZ, getEndOfDayUtcFromDateKey, getNextInstanceDateKey } from "../lib/recurrence";

describe("recurrence helpers", () => {
it("daily recurrence: next instance is tomorrow (EST) and due is end-of-day tomorrow", () => {
  const base = new Date("2026-01-05T15:00:00Z"); // 10am EST
  const nextKey = getNextInstanceDateKey({ pattern: "daily", interval: 1, baseDate: base, timeZone: DEFAULT_RECURRENCE_TZ });
  expect(nextKey).toBe("2026-01-06");

  const dueUtc = getEndOfDayUtcFromDateKey(nextKey, DEFAULT_RECURRENCE_TZ);
  const local = formatInTimeZone(dueUtc, DEFAULT_RECURRENCE_TZ, "yyyy-MM-dd HH:mm");
  expect(local).toBe("2026-01-06 23:59");
});

it("weekly recurrence: interval=2 advances 2 weeks", () => {
  const base = new Date("2026-01-05T15:00:00Z"); // Monday
  const nextKey = getNextInstanceDateKey({ pattern: "weekly", interval: 2, baseDate: base, timeZone: DEFAULT_RECURRENCE_TZ });
  expect(nextKey).toBe("2026-01-19");
});
});

