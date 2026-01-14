import { db } from "./server/db";
import { tasks } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkTasks() {
  try {
    const allTasks = await db.select().from(tasks);
    console.log("Total tasks in DB:", allTasks.length);
    
    const saraTasks = allTasks.filter(t => t.assignedToId === 4);
    console.log("Tasks assigned to Sara (ID 4):", saraTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
    
    if (allTasks.length > 0) {
      console.log("Sample task assignment:", {
        id: allTasks[0].id,
        assignedToId: allTasks[0].assignedToId,
        type: typeof allTasks[0].assignedToId
      });
    }
  } catch (err) {
    console.error("Error checking tasks:", err);
  } finally {
    process.exit();
  }
}

checkTasks();
