import { storage } from "./storage";
import { sendPushToUser } from "./push";
import { emailNotifications } from "./emailService";
import { sendSms } from "./twilioService";
import { log } from "./vite";

const defaultSmsRecipient = "+18089139158";
const smsAlertRecipient = (process.env.NOTIFICATION_ALERT_SMS_TO || defaultSmsRecipient).trim();

export async function sendTaskDeadlineSmsAlert(title: string, message: string, actionUrl: string) {
  if (!smsAlertRecipient) return;

  const baseUrl = process.env.APP_URL || process.env.REPLIT_DOMAINS?.split(",")[0] || "";
  const taskUrl = baseUrl ? `${baseUrl}${actionUrl}` : actionUrl;
  const smsBody = `${title}\n${message}\n${taskUrl}`.slice(0, 1500);

  try {
    const smsResult = await sendSms(smsAlertRecipient, smsBody);
    if (!smsResult.success) {
      log(`Failed to send task deadline SMS alert: ${smsResult.error || "Unknown error"}`, "notifications");
    }
  } catch (error) {
    log(`Task deadline SMS exception: ${error instanceof Error ? error.message : "Unknown error"}`, "notifications");
  }
}

export async function checkAndNotifyTaskDeadlines(userId: number) {
  const now = new Date();
  const dueBy = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  try {
    const dueTasks = await storage.getDueTasksForAssignee(userId, dueBy);
    if (!dueTasks.length) return 0;

    const actionUrls = dueTasks.map((t) => `/tasks?taskId=${t.id}`);
    
    // FIX: Check ALL notifications (read or unread) to prevent "read-then-notified-again" loop
    // We only want to notify once per task for each state (due soon vs overdue)
    const existing = await storage.getNotificationsByActionUrls(userId, actionUrls);
    const existingKeys = new Set(existing.map((n) => `${n.actionUrl ?? ""}::${n.title}`));

    const prefs = await storage.getUserNotificationPreferences(userId).catch(() => undefined);
    const emailEnabled = (prefs?.emailNotifications ?? true) && (prefs?.taskUpdates ?? true) && (prefs?.dueDateReminders ?? true);
    const user = emailEnabled ? await storage.getUser(String(userId)).catch(() => undefined) : undefined;
    const userEmail = user?.email;
    const userName = (user?.firstName || user?.lastName)
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : (user?.username || "there");

    let notificationsCreated = 0;

    for (const task of dueTasks) {
      if (!task.dueDate || task.status === "completed") continue;

      const dueDate = new Date(task.dueDate);
      const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const actionUrl = `/tasks?taskId=${task.id}`;

      let title = "";
      let message = "";
      let type: "warning" | "error" = "warning";

      if (hoursDiff < 0) {
        title = "⏰ Task Overdue!";
        message = `Task "${task.title}" is overdue!`;
        type = "error";
      } else if (hoursDiff <= 24) {
        title = "⚠️ Task Due Soon";
        message = `Task "${task.title}" is due in ${Math.max(1, Math.round(hoursDiff))} hours`;
        type = "warning";
      } else {
        continue;
      }

      const key = `${actionUrl}::${title}`;
      if (existingKeys.has(key)) continue;

      // Create In-App Notification
      await storage.createNotification({
        userId,
        type,
        title,
        message,
        category: "deadline",
        actionUrl,
        isRead: false,
      });

      // Send Email
      if (emailEnabled && userEmail) {
        console.log(`📧 Sending task due reminder email to ${userEmail} for task "${task.title}" (${hoursDiff} hours until due)`);
        void emailNotifications
          .sendTaskDueReminder(userName, userEmail, task.title, task.dueDate.toISOString())
          .then((result) => {
            console.log(`📧 Task reminder email result:`, result);
          })
          .catch((err) => {
            console.error(`❌ Failed to send task reminder email:`, err);
            log(`Failed to send task reminder email: ${err.message}`, "notifications");
          });
      } else {
        console.log(`📧 Task reminder email not sent - emailEnabled: ${emailEnabled}, userEmail: ${userEmail ? 'set' : 'not set'}`);
      }

      // Send Push
      void sendPushToUser(userId, {
        title: title === "⏰ Task Overdue!" ? "🚨 Task Overdue!" : title,
        body: message,
        url: actionUrl,
      }).catch((err) => log(`Failed to send push notification: ${err.message}`, "notifications"));

      // Send SMS alert for high-visibility task reminders
      void sendTaskDeadlineSmsAlert(title, message, actionUrl);

      existingKeys.add(key);
      notificationsCreated++;
    }

    return notificationsCreated;
  } catch (error) {
    log(`Error in checkAndNotifyTaskDeadlines: ${error instanceof Error ? error.message : "Unknown error"}`, "notifications");
    throw error;
  }
}
