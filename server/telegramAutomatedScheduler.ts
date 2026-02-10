import cron from "node-cron";
import { pool } from "./db";
import { sendTelegramBulk } from "./telegramService";
import { ensureMarketingCenterSchema } from "./routes/marketing-center";

/**
 * Processes scheduled and recurring Telegram automated messages.
 * Runs every minute, picks up due messages, sends to subscribers.
 */
export function startTelegramAutomatedScheduler() {
  void ensureMarketingCenterSchema();

  async function tick() {
    try {
      const now = new Date();

      // 1. Pick up one-time scheduled messages that are due
      const scheduledDue = await pool.query(
        `SELECT * FROM telegram_automated_messages
         WHERE status = 'active'
           AND is_recurring = false
           AND scheduled_at IS NOT NULL
           AND scheduled_at <= $1
           AND last_run_at IS NULL
         LIMIT 10`,
        [now]
      );

      for (const msg of scheduledDue.rows) {
        await processAutomatedMessage(msg);
        // Mark as completed (one-time)
        await pool.query(
          `UPDATE telegram_automated_messages SET status = 'completed', last_run_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [msg.id]
        );
      }

      // 2. Pick up recurring messages that are due
      const recurringDue = await pool.query(
        `SELECT * FROM telegram_automated_messages
         WHERE status = 'active'
           AND is_recurring = true
           AND next_run_at IS NOT NULL
           AND next_run_at <= $1
         LIMIT 10`,
        [now]
      );

      for (const msg of recurringDue.rows) {
        await processAutomatedMessage(msg);

        // Calculate next run
        const nextRun = new Date(msg.next_run_at);
        const pattern = msg.recurring_pattern || "daily";
        const interval = msg.recurring_interval || 1;

        if (pattern === "daily") {
          nextRun.setDate(nextRun.getDate() + interval);
        } else if (pattern === "weekly") {
          nextRun.setDate(nextRun.getDate() + interval * 7);
        } else if (pattern === "monthly") {
          nextRun.setMonth(nextRun.getMonth() + interval);
        }

        // Check end date
        let updatedNextRunAt: Date | null = nextRun;
        if (msg.recurring_end_date && nextRun > new Date(msg.recurring_end_date)) {
          updatedNextRunAt = null;
          await pool.query(
            `UPDATE telegram_automated_messages SET status = 'completed', next_run_at = NULL, last_run_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [msg.id]
          );
        } else {
          await pool.query(
            `UPDATE telegram_automated_messages SET next_run_at = $1, last_run_at = NOW(), updated_at = NOW() WHERE id = $2`,
            [updatedNextRunAt, msg.id]
          );
        }
      }
    } catch (error) {
      console.error("Telegram automated scheduler error:", error instanceof Error ? error.message : error);
    }
  }

  cron.schedule("* * * * *", tick);
  void tick();
  console.log("🤖 Telegram automated message scheduler started");
}

async function processAutomatedMessage(msg: any) {
  try {
    let subscribers;

    if (msg.audience === "individual" && msg.target_chat_id) {
      subscribers = [{ chat_id: msg.target_chat_id }];
    } else if (msg.audience === "tagged" && msg.target_tags) {
      const tags = typeof msg.target_tags === "string" ? JSON.parse(msg.target_tags) : msg.target_tags;
      const tagResult = await pool.query(
        `SELECT chat_id FROM telegram_subscribers WHERE is_active = true AND is_blocked = false AND tags ?| $1`,
        [tags]
      );
      subscribers = tagResult.rows;
    } else {
      const allResult = await pool.query(
        `SELECT chat_id FROM telegram_subscribers WHERE is_active = true AND is_blocked = false`
      );
      subscribers = allResult.rows;
    }

    const chatIds = subscribers.map((s: any) => s.chat_id);
    if (chatIds.length === 0) return;

    const results = await sendTelegramBulk(chatIds, msg.content);
    const sent = results.filter((r) => r.result.success).length;
    const failed = results.filter((r) => !r.result.success).length;

    await pool.query(
      `UPDATE telegram_automated_messages SET total_sent = total_sent + $1, total_failed = total_failed + $2, updated_at = NOW() WHERE id = $3`,
      [sent, failed, msg.id]
    );
  } catch (err) {
    console.error(`Failed to process automated message ${msg.id}:`, err);
  }
}
