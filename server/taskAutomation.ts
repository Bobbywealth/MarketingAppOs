import cron from "node-cron";
import { storage } from "./storage";
import { sendPushToUser } from "./push";

export function startTaskAutomation() {
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

          await sendPushToUser(task.assignedToId, {
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

