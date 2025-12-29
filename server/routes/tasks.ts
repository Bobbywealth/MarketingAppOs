import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { tasks, taskSpaces, taskComments } from "@shared/schema";
import { UserRole, rolePermissions } from "../rbac";
import { eq, and, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requireRole, requirePermission } from "../rbac";
import { 
  getCurrentUserContext 
} from "./utils";
import { 
  handleValidationError, 
  notifyAdminsAboutAction 
} from "./common";
import { insertTaskSchema, insertTaskSpaceSchema, insertTaskCommentSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

// Task Spaces routes
router.get("/task-spaces", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (_req: Request, res: Response) => {
  try {
    const spaces = await storage.getTaskSpaces();
    res.json(spaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch task spaces" });
  }
});

router.post("/task-spaces", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const { userId } = getCurrentUserContext(req);
    if (userId === null) {
      return res.status(400).json({ message: "Invalid user context" });
    }
    
    const spaceData = { ...req.body, createdBy: userId };
    console.log("Creating task space:", spaceData);
    const space = await storage.createTaskSpace(spaceData);
    res.status(201).json(space);
  } catch (error) {
    console.error("Task space creation error:", error);
    res.status(500).json({ message: "Failed to create task space" });
  }
});

router.patch("/task-spaces/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const space = await storage.updateTaskSpace(req.params.id, req.body);
    res.json(space);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update task space" });
  }
});

router.delete("/task-spaces/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    await storage.deleteTaskSpace(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete task space" });
  }
});

// Get tasks by space
router.get("/task-spaces/:id/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const tasks = await storage.getTasksBySpace(req.params.id);
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks for space" });
  }
});

// Task routes
router.get("/tasks", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { userId, role } = getCurrentUserContext(req);
    const currentUser = req.user as any;

    if (role === UserRole.CLIENT) {
      const clientId = currentUser?.clientId;
      const tasksList = clientId ? await storage.getTasksByClient(clientId) : [];
      return res.json(tasksList);
    }

    const allTasks = await storage.getTasks();
    
    // Filter tasks based on user role for staff
    let tasksList = allTasks;
    if (role === UserRole.STAFF) {
      tasksList = allTasks.filter((t) => t.assignedToId === userId);
      console.log(`🔒 Tasks filtered for STAFF: ${tasksList.length} assigned to user (out of ${allTasks.length} total)`);
    } else if (role === UserRole.MANAGER || role === UserRole.ADMIN) {
      console.log(`🔓 ${role} access: showing all ${allTasks.length} tasks`);
    }
    
    res.json(tasksList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.post("/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    console.log("📥 Backend received task data:", JSON.stringify(req.body, null, 2));
    const validatedData = insertTaskSchema.parse(req.body);
    console.log("✅ Validation passed, creating task:", validatedData);
    const task = await storage.createTask(validatedData);
    
    const { sendPushToUser } = await import('../push.js');
    
    // Enhanced task creation notifications
    const user = req.user as any;
    const creatorName = user?.firstName || user?.username || 'Someone';
    
    // Notify assignee if task is assigned to someone
    if (task.assignedToId) {
      await storage.createNotification({
        userId: task.assignedToId,
        type: 'info',
        title: '📋 New Task Assigned',
        message: `${creatorName} assigned you: "${task.title}"`,
        category: 'task',
        actionUrl: `/tasks?taskId=${task.id}`,
        isRead: false,
      });
      
      await sendPushToUser(task.assignedToId, {
        title: '📋 New Task Assigned',
        body: `${creatorName} assigned you: "${task.title}"`,
        url: `/tasks?taskId=${task.id}`,
      }).catch(err => console.error('Failed to send push notification:', err));
    }
    
    // Notify all team members (admin, manager, staff) about new task
    try {
      const allUsers = await storage.getUsers();
      const teamMembers = allUsers.filter(u => 
        u.role === 'admin' || u.role === 'manager' || u.role === 'staff'
      );
      
      for (const teamMember of teamMembers) {
        if (teamMember.id === user?.id || teamMember.id === task.assignedToId) {
          continue;
        }
        
        await storage.createNotification({
          userId: teamMember.id,
          type: 'info',
          title: '📋 New Task Created',
          message: `${creatorName} created: "${task.title}"`,
          category: 'task',
          actionUrl: `/tasks?taskId=${task.id}`,
          isRead: false,
        });
        
        await sendPushToUser(teamMember.id, {
          title: '📋 New Task Created',
          body: `${creatorName} created: "${task.title}"`,
          url: `/tasks?taskId=${task.id}`,
        }).catch(err => console.error('Failed to send push notification:', err));
      }
    } catch (teamNotifError) {
      console.error('Failed to notify team about task:', teamNotifError);
    }
    
    // Notify client users if task is related to their client
    if (task.clientId) {
      try {
        const clientUsers = await storage.getUsersByClientId(task.clientId);
        for (const clientUser of clientUsers) {
          if (clientUser.id === task.assignedToId) continue;
          
          await storage.createNotification({
            userId: clientUser.id,
            type: 'success',
            title: '📋 New Task Created',
            message: `New task "${task.title}" has been created for your project`,
            category: 'task',
            actionUrl: '/client-dashboard',
            isRead: false,
          });
          
          await sendPushToUser(clientUser.id, {
            title: '📋 New Task Created',
            body: `New task "${task.title}" has been created for your project`,
            url: '/client-dashboard',
          }).catch(err => console.error('Failed to send push notification:', err));
        }
      } catch (notifError) {
        console.error('Failed to notify client about task:', notifError);
      }
    }
    
    res.status(201).json(task);
  } catch (error) {
    console.error("❌ Task creation error:", error);
    handleValidationError(error, res);
  }
});

// AI-powered task parsing
router.post("/tasks/parse-ai", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ message: "Input text is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        message: "AI assistant not configured. Please add OPENAI_API_KEY to environment variables." 
      });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const [clientsList, usersList] = await Promise.all([
      storage.getClients(),
      storage.getUsers(),
    ]);

    const systemPrompt = `You are a task parsing assistant. Extract task details from natural language.

Available clients: ${clientsList.map(c => `${c.name} (ID: ${c.id})`).join(', ')}
Available users: ${usersList.map(u => `${u.username} (ID: ${u.id})`).join(', ')}

Return JSON with:
- title: string (required)
- description: string (optional)
- priority: "low" | "normal" | "high" | "urgent" (default: "normal")
- status: "todo" | "in_progress" | "review" | "completed" (default: "todo")
- dueDate: ISO date string (optional)
- clientId: string (optional)
- assignedToId: number (optional)
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    const transformedData = {
      ...parsed,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
      assignedToId: parsed.assignedToId ? parseInt(parsed.assignedToId) : undefined,
    };
    
    const taskData = insertTaskSchema.parse(transformedData);
    res.json({ success: true, taskData, originalInput: input });
  } catch (error: any) {
    console.error("AI parsing error:", error);
    res.status(500).json({ message: "Failed to parse task with AI", error: error.message });
  }
});

router.patch("/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const validatedData = insertTaskSchema.partial().strip().parse(req.body);
    const existingTask = await storage.getTask(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (validatedData.status === "completed" && existingTask.status !== "completed") {
      validatedData.completedAt = new Date();
    } else if (validatedData.status && validatedData.status !== "completed") {
      validatedData.completedAt = null;
    }

    const task = await storage.updateTask(req.params.id, validatedData);
    const { userId: currentUserId, role: actorRole } = getCurrentUserContext(req);
    const currentUser = req.user as any;
    const actorName = currentUser?.firstName || currentUser?.username || 'A team member';
    const { sendPushToUser } = await import('../push.js');
    
    if (validatedData.status === 'completed' && existingTask.status !== 'completed' && actorRole !== UserRole.ADMIN) {
      await notifyAdminsAboutAction(
        currentUserId || undefined,
        actorName,
        '✅ Task Completed',
        `${actorName} completed task: "${task.title}"`,
        'task',
        `/tasks?taskId=${task.id}`,
        'success'
      );
    }
    
    // Check if checklist item was completed
    if (validatedData.checklist && Array.isArray(validatedData.checklist)) {
      const oldChecklist = existingTask.checklist || [];
      const newlyCompleted = (validatedData.checklist as any[]).filter(
        (item: any) => item.completed && !oldChecklist.find((old: any) => old.id === item.id)?.completed
      );
      
      if (newlyCompleted.length > 0 && task.assignedToId && task.assignedToId !== currentUserId) {
        await storage.createNotification({
          userId: task.assignedToId,
          type: 'info',
          title: '✅ Checklist Updated',
          message: `${actorName} completed: ${newlyCompleted.map(i => i.text).join(", ")}`,
          category: 'task',
          actionUrl: `/tasks?taskId=${task.id}`,
          isRead: false,
        });
      }
    }

    // Notify about assignment changes
    if (validatedData.assignedToId && validatedData.assignedToId !== existingTask.assignedToId) {
      const allUsers = await storage.getUsers();
      const newAssignee = allUsers.find(u => u.id === validatedData.assignedToId);
      
      if (newAssignee && newAssignee.id !== currentUserId) {
        await storage.createNotification({
          userId: newAssignee.id,
          type: 'info',
          title: '📋 Task Assigned to You',
          message: `"${task.title}" has been assigned to you`,
          category: 'task',
          actionUrl: `/tasks?taskId=${task.id}`,
          isRead: false,
        });
        
        await sendPushToUser(newAssignee.id, {
          title: '📋 New Task Assigned',
          body: `"${task.title}" has been assigned to you`,
          url: `/tasks?taskId=${task.id}`,
        }).catch(err => console.error('Failed to send push:', err));
      }
    }
    
    res.json(task);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.delete("/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    await storage.deleteTask(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

// Task comments routes
router.get("/tasks/:taskId/comments", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const comments = await storage.getTaskComments(req.params.taskId);
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch task comments" });
  }
});

router.post("/tasks/:taskId/comments", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { userId: currentUserId } = getCurrentUserContext(req);
    const validatedData = insertTaskCommentSchema.parse({
      ...req.body,
      taskId: req.params.taskId,
      userId: currentUserId,
    });
    const comment = await storage.createTaskComment(validatedData);
    
    // Notification logic
    const task = await storage.getTask(req.params.taskId);
    if (task) {
      const { sendPushToUser } = await import('../push.js');
      const currentUser = req.user as any;
      const commenterName = currentUser?.firstName || currentUser?.username || 'Someone';
      
      if (task.assignedToId && task.assignedToId !== currentUserId) {
        await storage.createNotification({
          userId: task.assignedToId,
          type: 'info',
          title: '💬 New Task Comment',
          message: `${commenterName} commented on "${task.title}"`,
          category: 'task',
          actionUrl: `/tasks?taskId=${task.id}`,
          isRead: false,
        });
        await sendPushToUser(task.assignedToId, {
          title: '💬 New Task Comment',
          body: `${commenterName}: ${validatedData.comment.substring(0, 100)}`,
          url: `/tasks?taskId=${task.id}`,
        }).catch(err => console.error('Failed to send push:', err));
      }
    }
    
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create comment" });
  }
});

export default router;

