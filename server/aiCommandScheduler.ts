import cron from "node-cron";
import { storage } from "./storage";
import { processAIChat } from "./aiManager";
import { notificationService } from "./notificationService";
import { log } from "./vite";

/**
 * Picks up scheduled and recurring AI commands and executes them.
 */
export function startAiCommandScheduler() {
  async function tick() {
    try {
      const now = new Date();
      const due = await storage.getDueScheduledAiCommands();

      for (const command of due) {
        try {
          // 1. Mark as processing to avoid duplicate runs
          await storage.updateScheduledAiCommand(command.id, { status: "processing" });

          log(`🤖 Executing scheduled AI command for user ${command.userId}: "${command.command}"`, "ai");

          // 2. Execute the AI command
          const result = await processAIChat(command.command, command.userId, [], true);

          // 3. Update command with response and status
          const updates: any = {
            status: "completed",
            lastRunAt: now,
            lastResponse: result.response,
          };

          // 4. Handle recurrence
          if (command.isRecurring && command.recurringPattern) {
            const nextRun = new Date(command.nextRunAt!);
            const interval = command.recurringInterval || 1;

            if (command.recurringPattern === "daily") {
              nextRun.setDate(nextRun.getDate() + interval);
            } else if (command.recurringPattern === "weekly") {
              nextRun.setDate(nextRun.getDate() + (interval * 7));
            } else if (command.recurringPattern === "monthly") {
              nextRun.setMonth(nextRun.getMonth() + interval);
            }

            // Check if we passed the end date
            if (command.recurringEndDate && nextRun > command.recurringEndDate) {
              updates.nextRunAt = null;
            } else {
              updates.nextRunAt = nextRun;
            }
          } else {
            updates.nextRunAt = null;
          }

          await storage.updateScheduledAiCommand(command.id, updates);

          // 5. Notify the user
          await notificationService.createNotification({
            userId: command.userId,
            title: "Scheduled AI Command Completed",
            message: `Your scheduled command "${command.command.substring(0, 50)}..." has been executed. Check the results in the AI Business Manager.`,
            type: "success",
            category: "general",
            actionUrl: "/ai-business-manager",
          });

        } catch (error: any) {
          console.error(`Error processing scheduled AI command ${command.id}:`, error);
          await storage.updateScheduledAiCommand(command.id, { 
            status: "failed",
            lastResponse: `Error: ${error.message}`
          });
        }
      }
    } catch (error) {
      log(
        `Error in AI command scheduler: ${error instanceof Error ? error.message : "Unknown error"}`,
        "ai"
      );
    }
  }

  // Run every minute
  cron.schedule("* * * * *", tick);
  // Run once on startup
  void tick();

  console.log("🤖 AI command scheduler started");
}
