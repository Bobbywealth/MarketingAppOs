import { db } from "../db";
import { tasks } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";
import {
  DEFAULT_RECURRENCE_TZ,
  getDateKeyInTimeZone,
  getEndOfDayUtcFromDateKey,
  getNextInstanceDateKey,
} from "./recurrence";

export function stableRecurrenceSeriesId(task: any): string {
  const key = [
    task.title ?? "",
    task.assignedToId ?? "",
    task.clientId ?? "",
    task.spaceId ?? "",
    task.campaignId ?? "",
    task.recurringPattern ?? "",
    task.recurringInterval ?? "",
    task.scheduleFrom ?? "",
  ].join("|");
  return `rec_${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
}

export interface BackfillResult {
  success: boolean;
  todayKey: string;
  seriesProcessed: number;
  seriesUpdated: number;
  tasksCreated: number;
  skipped: number;
}

/**
 * Backfill recurring tasks: create a single "current" instance per recurrence
 * series (EST) if one is missing.
 *
 * Called both by the admin API endpoint and by the midnight EST cron job.
 */
export async function backfillRecurringTasks(
  options: { dryRun?: boolean } = {},
): Promise<BackfillResult> {
  const dryRun = Boolean(options.dryRun);
  const now = new Date();
  const todayKey = getDateKeyInTimeZone(now, DEFAULT_RECURRENCE_TZ);

  const recurringTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.isRecurring, true));

  // Group tasks into recurrence series
  const seriesMap = new Map<string, any[]>();
  for (const t of recurringTasks) {
    const seriesId =
      (t as any).recurrenceSeriesId || stableRecurrenceSeriesId(t);
    if (!seriesMap.has(seriesId)) seriesMap.set(seriesId, []);
    seriesMap.get(seriesId)!.push({ ...t, recurrenceSeriesId: seriesId });
  }

  let seriesProcessed = 0;
  let tasksCreated = 0;
  let seriesUpdated = 0;
  let skipped = 0;

  for (const [seriesId, seriesTasks] of seriesMap.entries()) {
    seriesProcessed++;

    // Pick a template task: most recently due/created
    const template = [...seriesTasks].sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      if (ad !== bd) return bd - ad;
      const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bc - ac;
    })[0];
    if (!template) continue;

    const pattern = String(template.recurringPattern || "daily");
    const interval = Number(template.recurringInterval || 1);
    const scheduleFrom = String(template.scheduleFrom || "due_date");

    const derivedKeyForTask = (t: any): string => {
      const base =
        t.recurrenceInstanceDate ||
        t.dueDate ||
        t.completedAt ||
        t.createdAt ||
        now;
      return typeof base === "string"
        ? base
        : getDateKeyInTimeZone(new Date(base), DEFAULT_RECURRENCE_TZ);
    };

    // Determine whether there's already an open/completed instance for today
    const todays = seriesTasks.filter(
      (t) => derivedKeyForTask(t) === todayKey,
    );
    const hasTodayOpen = todays.some(
      (t) => String(t.status) !== "completed",
    );
    const hasTodayCompleted =
      todays.length > 0 &&
      todays.every((t) => String(t.status) === "completed");

    // Determine last known instance date key (max derived key)
    const derivedKeys = seriesTasks
      .map(derivedKeyForTask)
      .filter(Boolean)
      .sort();
    const lastKey = derivedKeys.length
      ? derivedKeys[derivedKeys.length - 1]
      : todayKey;

    // Choose target instance key: ensure one "current" task exists, aligned to recurrence schedule.
    let targetKey: string;
    if (pattern === "daily") {
      if (hasTodayOpen) {
        skipped++;
        continue;
      }
      if (hasTodayCompleted) {
        targetKey = getNextInstanceDateKey({
          pattern: "daily",
          interval,
          baseDate: getEndOfDayUtcFromDateKey(todayKey, DEFAULT_RECURRENCE_TZ),
          timeZone: DEFAULT_RECURRENCE_TZ,
        });
      } else {
        targetKey = todayKey;
      }
    } else {
      // For non-daily patterns, compute next scheduled >= today.
      const hasOpenFutureOrToday = seriesTasks.some((t) => {
        const k = derivedKeyForTask(t);
        return k >= todayKey && String(t.status) !== "completed";
      });
      if (hasOpenFutureOrToday) {
        skipped++;
        continue;
      }

      let baseKey = lastKey;
      if (scheduleFrom === "completion_date") {
        const latestCompleted = [...seriesTasks]
          .filter((t) => t.completedAt)
          .sort(
            (a, b) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime(),
          )[0];
        if (latestCompleted?.completedAt) {
          baseKey = getDateKeyInTimeZone(
            new Date(latestCompleted.completedAt),
            DEFAULT_RECURRENCE_TZ,
          );
        }
      }

      let nextKey = getNextInstanceDateKey({
        pattern: pattern as any,
        interval,
        baseDate: getEndOfDayUtcFromDateKey(baseKey, DEFAULT_RECURRENCE_TZ),
        timeZone: DEFAULT_RECURRENCE_TZ,
      });

      let guard = 0;
      while (nextKey < todayKey && guard < 400) {
        guard++;
        nextKey = getNextInstanceDateKey({
          pattern: pattern as any,
          interval,
          baseDate: getEndOfDayUtcFromDateKey(nextKey, DEFAULT_RECURRENCE_TZ),
          timeZone: DEFAULT_RECURRENCE_TZ,
        });
      }

      targetKey = nextKey;
    }

    // If already exists (any status) for this series + targetKey, skip
    const [existing] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.recurrenceSeriesId, seriesId),
          eq(tasks.recurrenceInstanceDate, targetKey),
        ),
      )
      .limit(1);
    if (existing) {
      skipped++;
      continue;
    }

    // Ensure at least one task in the series has recurrenceSeriesId/recurrenceInstanceDate
    if (
      !(template as any).recurrenceSeriesId ||
      !(template as any).recurrenceInstanceDate
    ) {
      seriesUpdated++;
      if (!dryRun) {
        try {
          const base =
            template.dueDate ||
            template.completedAt ||
            template.createdAt ||
            now;
          const instKey = getDateKeyInTimeZone(
            new Date(base),
            DEFAULT_RECURRENCE_TZ,
          );
          await db
            .update(tasks)
            .set({
              recurrenceSeriesId: seriesId,
              recurrenceInstanceDate: instKey,
            } as any)
            .where(eq(tasks.id, template.id));
        } catch {
          // ignore
        }
      }
    }

    // Create the "current" To Do instance
    const dueDateUtc = getEndOfDayUtcFromDateKey(
      targetKey,
      DEFAULT_RECURRENCE_TZ,
    );
    const oldChecklist = (template.checklist || []) as any[];
    const resetChecklist = Array.isArray(oldChecklist)
      ? oldChecklist.map((i) => ({ ...i, completed: false }))
      : [];

    if (!dryRun) {
      try {
        await db.insert(tasks).values({
          campaignId: template.campaignId ?? null,
          clientId: template.clientId ?? null,
          assignedToId: template.assignedToId ?? null,
          spaceId: template.spaceId ?? null,
          title: template.title,
          description: template.description ?? null,
          status: "todo",
          priority: template.priority ?? "normal",
          dueDate: dueDateUtc,
          completedAt: null,
          isRecurring: true,
          recurringPattern: pattern,
          recurringInterval: interval,
          recurringEndDate: template.recurringEndDate ?? null,
          scheduleFrom,
          checklist: resetChecklist,
          recurrenceSeriesId: seriesId,
          recurrenceInstanceDate: targetKey,
        } as any);
        tasksCreated++;
      } catch (e: any) {
        // Unique constraint protects us from duplicates
        if (String(e?.code) !== "23505") throw e;
      }
    } else {
      tasksCreated++;
    }
  }

  return {
    success: true,
    todayKey,
    seriesProcessed,
    seriesUpdated,
    tasksCreated,
    skipped,
  };
}
