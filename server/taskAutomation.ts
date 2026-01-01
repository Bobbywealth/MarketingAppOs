import cron from "node-cron";
import { storage } from "./storage";
import { sendPushToUser } from "./push";

export function startTaskAutomation() {
  // Run every 15 minutes to generate due/overdue notifications without client polling.
  cron.schedule("*/15 * * * *", async () => {
    try {
      const now = new Date();
      const dueBy = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const dueTasks = await storage.getDueTasksForAllAssignees(dueBy);
      if (!dueTasks.length) return;

      // Group by assignee so we can de-dupe in a single notifications query per user.
      const tasksByUser = new Map<number, typeof dueTasks>();
      for (const t of dueTasks) {
        if (!t.assignedToId) continue;
        const list = tasksByUser.get(t.assignedToId) ?? [];
        list.push(t);
        tasksByUser.set(t.assignedToId, list);
      }

      for (const [userId, userTasks] of tasksByUser.entries()) {
        const actionUrls = userTasks.map((t) => `/tasks?taskId=${t.id}`);
        const existing = await storage.getUnreadNotificationsByActionUrls(userId, actionUrls);
        const existingKeys = new Set(existing.map((n) => `${n.actionUrl ?? ""}::${n.title}`));

        for (const task of userTasks) {
          if (!task.dueDate) continue;
          if (task.status === "completed") continue;

          const dueDate = new Date(task.dueDate);
          const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          const actionUrl = `/tasks?taskId=${task.id}`;

          // Past due
          if (hoursDiff < 0) {
            const title = "⏰ Task Overdue!";
            const key = `${actionUrl}::${title}`;
            if (existingKeys.has(key)) continue;

            await storage.createNotification({
              userId,
              type: "error",
              title,
              message: `Task "${task.title}" is overdue!`,
              category: "deadline",
              actionUrl,
              isRead: false,
            });

            void sendPushToUser(userId, {
              title: "🚨 Task Overdue!",
              body: `"${task.title}" is overdue!`,
              url: actionUrl,
            }).catch((err) => console.error("Failed to send push notification:", err));

            existingKeys.add(key);
          }
          // Due within 24 hours
          else if (hoursDiff <= 24) {
            const title = "⚠️ Task Due Soon";
            const key = `${actionUrl}::${title}`;
            if (existingKeys.has(key)) continue;

            await storage.createNotification({
              userId,
              type: "warning",
              title,
              message: `Task "${task.title}" is due in ${Math.max(1, Math.round(hoursDiff))} hours`,
              category: "deadline",
              actionUrl,
              isRead: false,
            });

            void sendPushToUser(userId, {
              title: "⏰ Task Due Soon",
              body: `"${task.title}" is due in ${Math.max(1, Math.round(hoursDiff))} hours`,
              url: actionUrl,
            }).catch((err) => console.error("Failed to send push notification:", err));

            existingKeys.add(key);
          }
        }
      }
    } catch (error) {
      console.error("Error in task automation (due/overdue):", error);
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
  
  console.log("🚀 Task automation service started");
}

