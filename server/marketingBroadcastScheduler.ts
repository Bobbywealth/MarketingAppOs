import cron from "node-cron";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { db } from "./db";
import { marketingBroadcasts } from "@shared/schema";
import { processMarketingBroadcast } from "./marketingBroadcastProcessor";
import { log } from "./vite";

/**
 * Picks up scheduled marketing broadcasts and starts sending them.
 *
 * Note: This is intentionally lightweight (polling once per minute) and uses an
 * atomic status transition (pending -> sending) to avoid double-sends.
 */
export function startMarketingBroadcastScheduler() {
  async function tick() {
    try {
      const now = new Date();
      const due = await db
        .select({ id: marketingBroadcasts.id })
        .from(marketingBroadcasts)
        .where(
          and(
            eq(marketingBroadcasts.status, "pending"),
            isNotNull(marketingBroadcasts.scheduledAt),
            lte(marketingBroadcasts.scheduledAt, now)
          )
        )
        .limit(25);

      if (!due.length) return;

      for (const row of due) {
        // Atomic claim (prevents multiple instances from starting same broadcast)
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

