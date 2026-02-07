import cron from "node-cron";
import { storage } from "./storage";
import { sendPushToUser } from "./push";
import { emailNotifications } from "./emailService";
import { checkAndNotifyTaskDeadlines } from "./notificationService";
import { log } from "./vite";
import { backfillRecurringTasks } from "./lib/recurringTaskBackfill";

export function startTaskAutomation() {
  // Run every 15 minutes to generate due/overdue notifications without client polling.
  cron.schedule("*/15 * * * *", async () => {
    try {
      const now = new Date();
      const dueBy = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const dueTasks = await storage.getDueTasksForAllAssignees(dueBy);
      if (!dueTasks.length) return;

      // Get unique assignee IDs
      const uniqueUserIds = Array.from(new Set(
        dueTasks
          .map(t => t.assignedToId)
          .filter((id): id is number => id !== null)
      ));

      for (const userId of uniqueUserIds) {
        await checkAndNotifyTaskDeadlines(userId);
      }
    } catch (error) {
      log(`Error in task automation (due/overdue): ${error instanceof Error ? error.message : "Unknown error"}`, "notifications");
    }
  });

  // Run daily at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running task due date automation...");
    try {
      const allTasks = await storage.getTasks();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const upcomingTasks = allTasks.filter(task => {
        if (!task.dueDate || task.status === "completed") return false;
        const dueDate = new Date(task.dueDate);
        return dueDate > new Date() && dueDate <= tomorrow;
      });

      console.log(`🔍 Found ${upcomingTasks.length} tasks nearing due date`);

      for (const task of upcomingTasks) {
        if (task.assignedToId) {
          await storage.createNotification({
            userId: task.assignedToId,
            type: 'warning',
            title: '📅 Task Due Tomorrow',
            message: `Task "${task.title}" is due tomorrow!`,
            category: 'deadline',
            actionUrl: `/tasks?taskId=${task.id}`,
            isRead: false,
          });

          const prefs = await storage.getUserNotificationPreferences(task.assignedToId).catch(() => undefined);
          const emailEnabled = (prefs?.emailNotifications ?? true) && (prefs?.taskUpdates ?? true) && (prefs?.dueDateReminders ?? true);
          if (emailEnabled) {
            const user = await storage.getUser(String(task.assignedToId)).catch(() => undefined);
            const userEmail = user?.email;
            const userName =
              (user?.firstName || user?.lastName)
                ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                : (user?.username || "there");
            if (userEmail && task.dueDate) {
              void emailNotifications
                .sendTaskDueReminder(userName, userEmail, task.title, task.dueDate)
                .catch((err) => console.error("Failed to send task due-tomorrow email:", err));
            }
          }

          void sendPushToUser(task.assignedToId, {
            title: '📅 Task Due Tomorrow',
            body: `Task "${task.title}" is due tomorrow!`,
            url: `/tasks?taskId=${task.id}`,
          }).catch(err => console.error('Failed to send push notification:', err));
        }
      }
    } catch (error) {
      console.error("Error in task automation:", error);
    }
  });
  
  // Run daily at midnight EST: repopulate all recurring tasks for the new day
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("🔄 Midnight EST: Repopulating recurring tasks...");
      try {
        const result = await backfillRecurringTasks();
        console.log(
          `🔄 Recurring task reset complete — ${result.tasksCreated} created, ${result.skipped} skipped (${result.seriesProcessed} series processed)`,
        );
      } catch (error) {
        console.error(
          "Error in midnight recurring task reset:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
    { timezone: "America/New_York" },
  );

  console.log("🚀 Task automation service started");
}

