import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { tasks, taskSpaces, taskComments } from "@shared/schema";
import { rolePermissions } from "../rbac";
import { UserRole } from "@shared/roles";
import { eq, and } from "drizzle-orm";
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
import { randomUUID } from "crypto";
import { DEFAULT_RECURRENCE_TZ, getDateKeyInTimeZone, getEndOfDayUtcFromDateKey, getNextInstanceDateKey } from "../lib/recurrence";
import { backfillRecurringTasks, stableRecurrenceSeriesId } from "../lib/recurringTaskBackfill";

const router = Router();

// Task Spaces routes
router.get("/task-spaces", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
    const userId = user?.id ? Number(user.id) : null;
    
    // DEBUG: Log spaces fetch
    console.log(`📋 Spaces fetch for user: id=${userId}, role=${normalizedRole}`);

    // Admin and Managers see all spaces
    const isAllAccess =
      normalizedRole === "admin" ||
      normalizedRole === "manager" ||
      normalizedRole === "creator_manager";
    
    const spaces = isAllAccess
      ? await storage.getTaskSpaces()
      : (userId ? await storage.getTaskSpacesForAssignee(userId) : []);

    console.log(`📋 Returning ${spaces.length} spaces for ${normalizedRole}`);
    res.json(spaces);
  } catch (error) {
    console.error("❌ Task spaces fetch error:", error);
    res.status(500).json({ message: "Failed to fetch task spaces" });
  }
});

router.post("/task-spaces", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
    const userId = user?.id ? Number(user.id) : null;
    
    // Only Admin, Manager, and Staff can create spaces
    const canCreate = normalizedRole === "admin" || normalizedRole === "manager" || normalizedRole === "staff";
    if (!canCreate) {
      return res.status(403).json({ message: "Forbidden" });
    }

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

router.patch("/task-spaces/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
    
    if (normalizedRole !== "admin" && normalizedRole !== "manager" && normalizedRole !== "staff") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Prevent invalid parent references (self-parenting / cycles)
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "parentSpaceId")) {
      const incoming = (req.body as any).parentSpaceId;
      const parentSpaceId =
        incoming === undefined || incoming === null || incoming === "" ? null : String(incoming);

      if (parentSpaceId && parentSpaceId === req.params.id) {
        return res.status(400).json({ message: "A space cannot be its own parent" });
      }

      if (parentSpaceId) {
        const allSpaces = await storage.getTaskSpaces();
        const byId = new Map(allSpaces.map((s) => [s.id, s] as const));
        let current = byId.get(parentSpaceId);
        let guard = 0;
        while (current && guard < 1000) {
          guard++;
          if (current.id === req.params.id) {
            return res.status(400).json({ message: "Invalid parent: would create a cycle" });
          }
          const nextParent = current.parentSpaceId ?? null;
          if (!nextParent) break;
          current = byId.get(nextParent);
        }
      }

      (req.body as any).parentSpaceId = parentSpaceId;
    }

    const space = await storage.updateTaskSpace(req.params.id, req.body);
    res.json(space);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update task space" });
  }
});

// Bulk reorder spaces
router.patch("/task-spaces-reorder", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();

    if (normalizedRole !== "admin" && normalizedRole !== "manager" && normalizedRole !== "staff") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const items: Array<{ id: string; order: number }> = req.body?.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items array is required" });
    }

    for (const item of items) {
      await db
        .update(taskSpaces)
        .set({ order: item.order, updatedAt: new Date() })
        .where(eq(taskSpaces.id, item.id));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Reorder spaces error:", error);
    res.status(500).json({ message: "Failed to reorder spaces" });
  }
});

router.delete("/task-spaces/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
    
    if (normalizedRole !== "admin" && normalizedRole !== "manager") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await storage.deleteTaskSpace(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete task space" });
  }
});

// Get tasks by space
router.get("/task-spaces/:id/tasks", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?.id ? Number(user.id) : null;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
    
    const isAllAccess = normalizedRole === "admin" || normalizedRole === "manager" || normalizedRole === "creator_manager";

    const spaceTasks = await storage.getTasksBySpace(req.params.id);
    
    if (!isAllAccess && normalizedRole !== "client" && userId) {
      // Internal roles see assigned tasks
      return res.json(spaceTasks.filter((t: any) => Number(t.assignedToId) === Number(userId)));
    } else if (normalizedRole === "client") {
      // Clients see their tasks
      return res.json(spaceTasks.filter((t: any) => t.clientId === user.clientId));
    }

    res.json(spaceTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks for space" });
  }
});

// Task routes
router.get("/tasks", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const tasksList = await storage.getTasks(user);
    res.json(tasksList);
  } catch (error) {
    console.error("❌ Task fetch error:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.get("/tasks/recurring-series", isAuthenticated, async (_req: Request, res: Response) => {
  try {
    const recurringTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.isRecurring, true));

    const seriesMap = new Map<string, any[]>();
    for (const task of recurringTasks) {
      const seriesId =
        (task as any).recurrenceSeriesId || stableRecurrenceSeriesId(task);
      if (!seriesMap.has(seriesId)) seriesMap.set(seriesId, []);
      seriesMap.get(seriesId)!.push({ ...task, recurrenceSeriesId: seriesId });
    }

    const now = new Date();
    const todayKey = getDateKeyInTimeZone(now, DEFAULT_RECURRENCE_TZ);

    const series = Array.from(seriesMap.entries()).map(([seriesId, seriesTasks]) => {
      const template = [...seriesTasks].sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        if (ad !== bd) return bd - ad;
        const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bc - ac;
      })[0];

      const pattern = String(template?.recurringPattern || "daily");
      const interval = Number(template?.recurringInterval || 1);
      const scheduleFrom = String(template?.scheduleFrom || "due_date");
      const recurringEndDate = template?.recurringEndDate
        ? new Date(template.recurringEndDate)
        : null;

      const derivedKeyForTask = (t: any): string => {
        const base =
          t.recurrenceInstanceDate ||
          t.dueDate ||
          t.completedAt ||
          t.createdAt ||
          now;
        return typeof base === "string"
          ? base
          : getDateKeyInTimeZone(new Date(base), DEFAULT_RECURRENCE_TZ);
      };

      const derivedKeys = seriesTasks
        .map(derivedKeyForTask)
        .filter(Boolean)
        .sort();
      const lastKey = derivedKeys.length ? derivedKeys[derivedKeys.length - 1] : todayKey;

      let nextKey: string | null = null;
      if (pattern) {
        const candidate = getNextInstanceDateKey({
          pattern: pattern as any,
          interval,
          baseDate: getEndOfDayUtcFromDateKey(lastKey, DEFAULT_RECURRENCE_TZ),
          timeZone: DEFAULT_RECURRENCE_TZ,
        });
        const candidateDueUtc = getEndOfDayUtcFromDateKey(
          candidate,
          DEFAULT_RECURRENCE_TZ,
        );
        nextKey =
          recurringEndDate && candidateDueUtc > recurringEndDate ? null : candidate;
      }

      const completedInstances = seriesTasks.filter((t) => t.status === "completed").length;
      const openInstances = seriesTasks.length - completedInstances;

      return {
        seriesId,
        title: template?.title ?? "Untitled recurring task",
        recurringPattern: pattern,
        recurringInterval: interval,
        recurringEndDate: recurringEndDate ? recurringEndDate.toISOString() : null,
        scheduleFrom,
        totalInstances: seriesTasks.length,
        openInstances,
        completedInstances,
        lastInstanceDateKey: lastKey,
        nextInstanceDateKey: nextKey,
        latestTask: template
          ? {
              id: template.id,
              status: template.status,
              dueDate: template.dueDate,
              assignedToId: template.assignedToId,
              clientId: template.clientId,
              spaceId: template.spaceId,
            }
          : null,
      };
    });

    res.json(series);
  } catch (error) {
    console.error("❌ Recurring series fetch error:", error);
    res.status(500).json({ message: "Failed to fetch recurring series" });
  }
});

// Backfill recurring tasks: create a single "current" instance per series (EST) if missing.
router.post(
  "/tasks/backfill-recurring",
  isAuthenticated,
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  async (req: Request, res: Response) => {
    try {
      const dryRun = Boolean((req.body as any)?.dryRun);
      const result = await backfillRecurringTasks({ dryRun });
      return res.json({ ...result, dryRun });
    } catch (error) {
      console.error("Error backfilling recurring tasks:", error);
      return res.status(500).json({ message: "Failed to backfill recurring tasks" });
    }
  }
);

router.post("/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    console.log("📥 Backend received task data:", JSON.stringify(req.body, null, 2));
    const validatedData = insertTaskSchema.parse(req.body) as any;

    // Ensure robust recurrence identifiers are present for recurring tasks
    if (validatedData?.isRecurring) {
      validatedData.recurrenceSeriesId = validatedData.recurrenceSeriesId || randomUUID();
      const base = validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date();
      validatedData.recurrenceInstanceDate = validatedData.recurrenceInstanceDate || getDateKeyInTimeZone(base, DEFAULT_RECURRENCE_TZ);
    }
    console.log("✅ Validation passed, creating task:", validatedData);
    const task = await storage.createTask(validatedData);
    
    const { sendPushToUser } = await import('../push');
    
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
      
      void sendPushToUser(task.assignedToId, {
        title: '📋 New Task Assigned',
        body: `${creatorName} assigned you: "${task.title}"`,
        url: `/tasks?taskId=${task.id}`,
      }).catch(err => console.error('Failed to send push notification:', err));

      // Email notification
      try {
        console.log(`📧 Task assignment email check - Task ID: ${task.id}, Assigned to: ${task.assignedToId}`);
        const assignee = await storage.getUser(String(task.assignedToId));
        console.log(`📧 Assignee found:`, assignee ? { id: assignee.id, email: assignee.email, name: assignee.firstName || assignee.username } : 'Not found');
        
        if (assignee?.email) {
          const { emailNotifications } = await import('../emailService');
          const assigneeName = assignee.firstName || assignee.username || 'there';
          
          // Respect preferences
          const prefs = await storage.getUserNotificationPreferences(assignee.id);
          console.log(`📧 User notification preferences:`, prefs);
          
          if (prefs?.emailNotifications !== false && prefs?.taskUpdates !== false) {
            console.log(`📧 Sending task assignment email to ${assignee.email}...`);
            void emailNotifications.sendTaskAssignedEmail(
              assigneeName,
              assignee.email,
              task.title,
              task.description || '',
              task.priority || 'normal',
              task.dueDate ? task.dueDate.toISOString() : null,
              creatorName
            ).catch(err => console.error('Failed to send task assignment email:', err));
          } else {
            console.log(`📧 Email not sent - User has disabled email notifications or task updates`);
          }
        } else {
          console.log(`📧 Email not sent - Assignee has no email address`);
        }
      } catch (emailErr) {
        console.error('Error triggered during task assignment email:', emailErr);
      }
    }
    
    // Notify all team members (admin, manager, staff) about new task
    try {
      const allUsers = await storage.getUsers();
      const teamMembers = allUsers.filter(u =>
        u.role === 'admin' || u.role === 'manager' || u.role === 'staff'
      );

      // Batch fetch notification preferences for all team members at once
      const teamMemberIds = teamMembers.map(tm => tm.id);
      const allPrefs = await Promise.all(
        teamMemberIds.map(id => storage.getUserNotificationPreferences(id).catch(() => null))
      );
      const prefsMap = new Map(teamMemberIds.map((id, i) => [id, allPrefs[i]]));

      // Prepare all notifications and push notifications
      const notifications = [];
      const pushNotifications = [];

      for (const teamMember of teamMembers) {
        if (teamMember.id === user?.id || teamMember.id === task.assignedToId) {
          continue;
        }

        notifications.push({
          userId: teamMember.id,
          type: 'info' as const,
          title: '📋 New Task Created',
          message: `${creatorName} created: "${task.title}"`,
          category: 'task',
          actionUrl: `/tasks?taskId=${task.id}`,
          isRead: false,
        });

        pushNotifications.push({
          userId: teamMember.id,
          title: '📋 New Task Created',
          body: `${creatorName} created: "${task.title}"`,
          url: `/tasks?taskId=${task.id}`,
        });
      }

      // Batch create all notifications
      for (const notif of notifications) {
        await storage.createNotification(notif);
      }

      // Send push notifications
      for (const pushNotif of pushNotifications) {
        void sendPushToUser(pushNotif.userId, pushNotif).catch(err =>
          console.error('Failed to send push notification:', err)
        );
      }

      // Email notifications for team members
      const { emailNotifications } = await import('../emailService');
      const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';

      for (const teamMember of teamMembers) {
        if (teamMember.id === user?.id || teamMember.id === task.assignedToId || !teamMember.email) {
          continue;
        }

        const prefs = prefsMap.get(teamMember.id);
        if (prefs?.emailNotifications !== false && prefs?.taskUpdates !== false) {
          void emailNotifications.sendActionAlertEmail(
            teamMember.email,
            '📋 New Task Created',
            `${creatorName} created a new task: "${task.title}"`,
            `${appUrl}/tasks?taskId=${task.id}`,
            'info'
          ).catch(err =>
            console.error(`Failed to send task creation email to ${teamMember.username}:`, err)
          );
        }
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

          void sendPushToUser(clientUser.id, {
            title: '📋 New Task Created',
            body: `New task "${task.title}" has been created for your project`,
            url: '/client-dashboard',
          }).catch(err => console.error('Failed to send push notification:', err));

          // Send email notification to client user
          if (clientUser.email) {
            const { emailNotifications } = await import("../emailService");
            void emailNotifications.sendTaskAssignedEmail(
              clientUser.firstName || clientUser.username,
              clientUser.email,
              task.title,
              task.description || '',
              task.priority || 'normal',
              task.dueDate?.toISOString() || null,
              req.user?.firstName || req.user?.username || 'Team'
            ).catch(err => console.error('Failed to send task email to client user:', err));
          }
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
    const validatedData = insertTaskSchema.partial().strip().parse(req.body) as any;
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
    const { sendPushToUser } = await import('../push');

    // Recurring tasks: when completed, immediately create the next occurrence due EOD tomorrow (EST)
    if (
      validatedData.status === "completed" &&
      existingTask.status !== "completed" &&
      (existingTask as any).isRecurring
    ) {
      const recurringPattern = String((existingTask as any).recurringPattern || "daily");
      const interval = Number((existingTask as any).recurringInterval || 1);
      const scheduleFrom = String((existingTask as any).scheduleFrom || "due_date");

      const seriesId = (existingTask as any).recurrenceSeriesId || randomUUID();
      const baseDate =
        scheduleFrom === "completion_date"
          ? (task.completedAt || new Date())
          : ((existingTask as any).dueDate || new Date());

      const currentInstanceDateKey =
        (existingTask as any).recurrenceInstanceDate || getDateKeyInTimeZone(baseDate, DEFAULT_RECURRENCE_TZ);

      // Persist missing recurrence identifiers on the completed instance (best-effort)
      if (!(existingTask as any).recurrenceSeriesId || !(existingTask as any).recurrenceInstanceDate) {
        try {
          await db
            .update(tasks)
            .set({ recurrenceSeriesId: seriesId, recurrenceInstanceDate: currentInstanceDateKey } as any)
            .where(eq(tasks.id, task.id));
        } catch (e) {
          // ignore
        }
      }

      const nextInstanceDateKey = getNextInstanceDateKey({
        pattern: recurringPattern as any,
        interval,
        baseDate,
        timeZone: DEFAULT_RECURRENCE_TZ,
      });

      const nextDueDateUtc = getEndOfDayUtcFromDateKey(nextInstanceDateKey, DEFAULT_RECURRENCE_TZ);
      const recurringEndDate = (existingTask as any).recurringEndDate ? new Date((existingTask as any).recurringEndDate) : null;

      if (!recurringEndDate || nextDueDateUtc <= recurringEndDate) {
        const oldChecklist = ((existingTask as any).checklist || []) as any[];
        const resetChecklist = Array.isArray(oldChecklist)
          ? oldChecklist.map((i) => ({ ...i, completed: false }))
          : [];

        try {
          await db.insert(tasks).values({
            campaignId: (existingTask as any).campaignId ?? null,
            clientId: (existingTask as any).clientId ?? null,
            assignedToId: (existingTask as any).assignedToId ?? null,
            spaceId: (existingTask as any).spaceId ?? null,
            title: (existingTask as any).title,
            description: (existingTask as any).description ?? null,
            status: "todo",
            priority: (existingTask as any).priority ?? "normal",
            dueDate: nextDueDateUtc,
            completedAt: null,
            isRecurring: true,
            recurringPattern,
            recurringInterval: interval,
            recurringEndDate: (existingTask as any).recurringEndDate ?? null,
            scheduleFrom,
            checklist: resetChecklist,
            recurrenceSeriesId: seriesId,
            recurrenceInstanceDate: nextInstanceDateKey,
          } as any);
        } catch (e: any) {
          // Unique constraint protects us from duplicates; ignore duplicate errors.
          if (String(e?.code) !== "23505") {
            console.error("Failed to create next recurring task occurrence:", e);
          }
        }
      }
    }
    
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

        // Email notification for checklist update
        try {
          const assignee = await storage.getUser(String(task.assignedToId));
          if (assignee?.email) {
            const { emailNotifications } = await import('../emailService');
            const prefs = await storage.getUserNotificationPreferences(assignee.id).catch(() => null);
            if (prefs?.emailNotifications !== false && prefs?.taskUpdates !== false) {
              const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
              void emailNotifications.sendActionAlertEmail(
                assignee.email,
                '✅ Checklist Updated',
                `${actorName} completed: ${newlyCompleted.map(i => i.text).join(", ")} on task "${task.title}"`,
                `${appUrl}/tasks?taskId=${task.id}`,
                'success'
              ).catch(err => console.error(`Failed to send checklist email to ${assignee.username}:`, err));
            }
          }
        } catch (e) {
          console.error('Email error in checklist notification:', e);
        }
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
        
        void sendPushToUser(newAssignee.id, {
          title: '📋 New Task Assigned',
          body: `"${task.title}" has been assigned to you`,
          url: `/tasks?taskId=${task.id}`,
        }).catch(err => console.error('Failed to send push:', err));

        // Email notification
        try {
          const { emailNotifications } = await import('../emailService');
          const assigneeName = newAssignee.firstName || newAssignee.username || 'there';
          
          // Respect preferences
          const prefs = await storage.getUserNotificationPreferences(newAssignee.id);
          if (prefs?.emailNotifications !== false && prefs?.taskUpdates !== false) {
            void emailNotifications.sendTaskAssignedEmail(
              assigneeName,
              newAssignee.email,
              task.title,
              task.description || '',
              task.priority || 'normal',
              task.dueDate ? (task.dueDate as any).toISOString() : null,
              actorName
            ).catch(err => console.error('Failed to send task assignment email:', err));
          }
        } catch (emailErr) {
          console.error('Error triggered during task re-assignment email:', emailErr);
        }
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
      const { sendPushToUser } = await import('../push');
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
        void sendPushToUser(task.assignedToId, {
          title: '💬 New Task Comment',
          body: `${commenterName}: ${validatedData.comment.substring(0, 100)}`,
          url: `/tasks?taskId=${task.id}`,
        }).catch(err => console.error('Failed to send push:', err));

        // Email notification for task comment
        try {
          const assignee = await storage.getUser(String(task.assignedToId));
          if (assignee?.email) {
            const { emailNotifications } = await import('../emailService');
            const prefs = await storage.getUserNotificationPreferences(assignee.id).catch(() => null);
            if (prefs?.emailNotifications !== false && prefs?.taskUpdates !== false) {
              const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
              void emailNotifications.sendTaskCommentEmail(
                assignee.email,
                commenterName,
                task.title,
                validatedData.comment,
                `${appUrl}/tasks?taskId=${task.id}`
              ).catch(err => console.error(`Failed to send comment email to ${assignee.username}:`, err));
            }
          }
        } catch (e) {
          console.error('Email error in comment notification:', e);
        }
      }
    }
    
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create comment" });
  }
});

export default router;
