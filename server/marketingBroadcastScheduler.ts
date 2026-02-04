import cron from "node-cron";
import { and, eq, isNotNull, lte, or } from "drizzle-orm";
import { db } from "./db";
import { marketingBroadcasts } from "@shared/schema";
import { processMarketingBroadcast } from "./marketingBroadcastProcessor";
import { log } from "./vite";
import { storage } from "./storage";
import { ensureMarketingCenterSchema } from "./routes/marketing-center";

/**
 * Picks up scheduled and recurring marketing broadcasts and starts sending them.
 */
export function startMarketingBroadcastScheduler() {
  // Ensure schema exists before running queries
  void ensureMarketingCenterSchema();
  async function tick() {
    try {
      const now = new Date();
      
      // 1. Pick up standard scheduled broadcasts
      const due = await db
        .select({ id: marketingBroadcasts.id })
        .from(marketingBroadcasts)
        .where(
          and(
            eq(marketingBroadcasts.status, "pending"),
            eq(marketingBroadcasts.isRecurring, false),
            isNotNull(marketingBroadcasts.scheduledAt),
            lte(marketingBroadcasts.scheduledAt, now)
          )
        )
        .limit(25);

      for (const row of due) {
        const [claimed] = await db
          .update(marketingBroadcasts)
          .set({ status: "sending" })
          .where(and(eq(marketingBroadcasts.id, row.id), eq(marketingBroadcasts.status, "pending")))
          .returning({ id: marketingBroadcasts.id });

        if (!claimed) continue;

        processMarketingBroadcast(claimed.id).catch((err) =>
          console.error(`Broadcast ${claimed.id} scheduler background error:`, err)
        );
      }

      // 2. Pick up recurring broadcasts
      const recurringDue = await db
        .select()
        .from(marketingBroadcasts)
        .where(
          and(
            eq(marketingBroadcasts.isRecurring, true),
            isNotNull(marketingBroadcasts.nextRunAt),
            lte(marketingBroadcasts.nextRunAt, now),
            or(
              isNotNull(marketingBroadcasts.recurringEndDate),
              lte(marketingBroadcasts.nextRunAt, marketingBroadcasts.recurringEndDate)
            )
          )
        )
        .limit(10);

      for (const template of recurringDue) {
        // Calculate next run date
        const nextRun = new Date(template.nextRunAt!);
        const pattern = template.recurringPattern || "daily";
        const interval = template.recurringInterval || 1;

        if (pattern === "daily") {
          nextRun.setDate(nextRun.getDate() + interval);
        } else if (pattern === "weekly") {
          nextRun.setDate(nextRun.getDate() + (interval * 7));
        } else if (pattern === "monthly") {
          nextRun.setMonth(nextRun.getMonth() + interval);
        }

        // Check if we passed the end date
        let updatedNextRunAt: Date | null = nextRun;
        if (template.recurringEndDate && nextRun > template.recurringEndDate) {
          updatedNextRunAt = null;
        }

        // Update template first (atomic claim via nextRunAt update)
        const [updatedTemplate] = await db
          .update(marketingBroadcasts)
          .set({ nextRunAt: updatedNextRunAt })
          .where(and(eq(marketingBroadcasts.id, template.id), eq(marketingBroadcasts.nextRunAt, template.nextRunAt)))
          .returning();

        if (!updatedTemplate) continue;

        // Create a child broadcast for this run
        const childBroadcast = await storage.createMarketingBroadcast({
          title: template.title,
          type: template.type,
          status: "sending",
          subject: template.subject,
          content: template.content,
          audience: template.audience,
          groupId: template.groupId,
          customRecipient: template.customRecipient,
          filters: template.filters,
          mediaUrls: template.mediaUrls,
          useAiPersonalization: template.useAiPersonalization,
          createdBy: template.createdBy,
          parentBroadcastId: template.id,
          isRecurring: false,
        });

        processMarketingBroadcast(childBroadcast.id).catch((err) =>
          console.error(`Recurring child broadcast ${childBroadcast.id} background error:`, err)
        );
      }
    } catch (error) {
      log(
        `Error in marketing broadcast scheduler: ${error instanceof Error ? error.message : "Unknown error"}`,
        "marketing"
      );
    }
  }

  // Run every minute
  cron.schedule("* * * * *", tick);
  // Run once on startup
  void tick();

  console.log("📣 Marketing broadcast scheduler started");
}

