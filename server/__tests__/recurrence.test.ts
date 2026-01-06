import test from "node:test";
import assert from "node:assert/strict";
import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_RECURRENCE_TZ, getEndOfDayUtcFromDateKey, getNextInstanceDateKey } from "../lib/recurrence";

test("daily recurrence: next instance is tomorrow (EST) and due is end-of-day tomorrow", () => {
  const base = new Date("2026-01-05T15:00:00Z"); // 10am EST
  const nextKey = getNextInstanceDateKey({ pattern: "daily", interval: 1, baseDate: base, timeZone: DEFAULT_RECURRENCE_TZ });
  assert.equal(nextKey, "2026-01-06");

  const dueUtc = getEndOfDayUtcFromDateKey(nextKey, DEFAULT_RECURRENCE_TZ);
  const local = formatInTimeZone(dueUtc, DEFAULT_RECURRENCE_TZ, "yyyy-MM-dd HH:mm");
  assert.equal(local, "2026-01-06 23:59");
});

test("weekly recurrence: interval=2 advances 2 weeks", () => {
  const base = new Date("2026-01-05T15:00:00Z"); // Monday
  const nextKey = getNextInstanceDateKey({ pattern: "weekly", interval: 2, baseDate: base, timeZone: DEFAULT_RECURRENCE_TZ });
  assert.equal(nextKey, "2026-01-19");
});


