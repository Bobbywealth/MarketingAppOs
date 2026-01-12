import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { tasks, taskSpaces, taskComments } from "@shared/schema";
import { rolePermissions } from "../rbac";
import { UserRole } from "@shared/roles";
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
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import { DEFAULT_RECURRENCE_TZ, getDateKeyInTimeZone, getEndOfDayUtcFromDateKey, getNextInstanceDateKey } from "../lib/recurrence";

const router = Router();

function stableRecurrenceSeriesId(task: any): string {
  const key = [
    task.title ?? "",
    task.assignedToId ?? "",
    task.clientId ?? "",
    task.spaceId ?? "",
    task.campaignId ?? "",
    task.recurringPattern ?? "",
    task.recurringInterval ?? "",
    task.scheduleFrom ?? "",
  ].join("|");
  return `rec_${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
}

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
    const { userId, role } = getCurrentUserContext(req);
    const normalizedRole = String(role ?? "").trim().toLowerCase();
    const restrictToAssignee = normalizedRole === UserRole.STAFF;

    const spaceTasks = await storage.getTasksBySpace(req.params.id);
    if (restrictToAssignee) {
      if (!userId) return res.json([]);
      return res.json(spaceTasks.filter((t: any) => Number(t.assignedToId) === Number(userId)));
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
    const { userId, role } = getCurrentUserContext(req);
    const currentUser = req.user as any;

    const normalizedRole = String(role ?? "").trim().toLowerCase();
    const isAllAccessRole =
      normalizedRole === UserRole.ADMIN ||
      normalizedRole === UserRole.MANAGER ||
      normalizedRole === UserRole.CREATOR_MANAGER;

    // Least-privilege default: if role context is missing/unknown, return nothing (do NOT fall back to "all tasks").
    if (!normalizedRole) {
      return res.json([]);
    }

    if (normalizedRole === UserRole.CLIENT) {
      const clientId = currentUser?.clientId;
      const tasksList = clientId ? await storage.getTasksByClient(clientId) : [];
      return res.json(tasksList);
    }

    // Non-admin internal roles should only see tasks assigned to them.
    // This prevents staff (and similar roles) from seeing the entire team's tasks.
    const restrictToAssignee =
      normalizedRole === UserRole.STAFF ||
      normalizedRole === UserRole.SALES_AGENT ||
      normalizedRole === UserRole.CREATOR;

    if (restrictToAssignee) {
      if (!userId) return res.json([]);
      const tasksList = await storage.getTasksAssignedToUser(userId);
      return res.json(tasksList);
    }

    if (isAllAccessRole) {
      const allTasks = await storage.getTasks();
      return res.json(allTasks);
    }

    // Unknown role: safest behavior is "no tasks"
    return res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks" });
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
      const now = new Date();
      const todayKey = getDateKeyInTimeZone(now, DEFAULT_RECURRENCE_TZ);

      const recurringTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.isRecurring, true));

      // Group tasks into recurrence series
      const seriesMap = new Map<string, any[]>();
      for (const t of recurringTasks) {
        const seriesId = (t as any).recurrenceSeriesId || stableRecurrenceSeriesId(t);
        if (!seriesMap.has(seriesId)) seriesMap.set(seriesId, []);
        seriesMap.get(seriesId)!.push({ ...t, recurrenceSeriesId: seriesId });
      }

      let seriesProcessed = 0;
      let tasksCreated = 0;
      let seriesUpdated = 0;
      let skipped = 0;

      for (const [seriesId, seriesTasks] of seriesMap.entries()) {
        seriesProcessed++;

        // Pick a template task: most recently due/created
        const template = [...seriesTasks].sort((a, b) => {
          const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          if (ad !== bd) return bd - ad;
          const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bc - ac;
        })[0];
        if (!template) continue;

        const pattern = String(template.recurringPattern || "daily");
        const interval = Number(template.recurringInterval || 1);
        const scheduleFrom = String(template.scheduleFrom || "due_date");

        const derivedKeyForTask = (t: any): string => {
          const base = t.recurrenceInstanceDate || t.dueDate || t.completedAt || t.createdAt || now;
          return typeof base === "string"
            ? base
            : getDateKeyInTimeZone(new Date(base), DEFAULT_RECURRENCE_TZ);
        };

        // Determine whether there's already an open/completed instance for today (based on derived keys)
        const todays = seriesTasks.filter((t) => derivedKeyForTask(t) === todayKey);
        const hasTodayOpen = todays.some((t) => String(t.status) !== "completed");
        const hasTodayCompleted = todays.length > 0 && todays.every((t) => String(t.status) === "completed");

        // Determine last known instance date key (max derived key)
        const derivedKeys = seriesTasks.map(derivedKeyForTask).filter(Boolean).sort();
        const lastKey = derivedKeys.length ? derivedKeys[derivedKeys.length - 1] : todayKey;

        // Choose target instance key (no flood): ensure one "current" task exists, aligned to recurrence schedule.
        let targetKey: string;
        if (pattern === "daily") {
          if (hasTodayOpen) {
            skipped++;
            continue;
          }
          if (hasTodayCompleted) {
            targetKey = getNextInstanceDateKey({
              pattern: "daily",
              interval,
              baseDate: getEndOfDayUtcFromDateKey(todayKey, DEFAULT_RECURRENCE_TZ),
              timeZone: DEFAULT_RECURRENCE_TZ,
            });
          } else {
            targetKey = todayKey;
          }
        } else {
          // For non-daily patterns, don't force a "today" task if it isn't scheduled; compute next scheduled >= today.
          // If there's any open task with a derived key >= todayKey, don't create another.
          const hasOpenFutureOrToday = seriesTasks.some((t) => {
            const k = derivedKeyForTask(t);
            return k >= todayKey && String(t.status) !== "completed";
          });
          if (hasOpenFutureOrToday) {
            skipped++;
            continue;
          }

          // Base from either lastKey (due-date schedule) or latest completion (completion-date schedule)
          let baseKey = lastKey;
          if (scheduleFrom === "completion_date") {
            const latestCompleted = [...seriesTasks]
              .filter((t) => t.completedAt)
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
            if (latestCompleted?.completedAt) {
              baseKey = getDateKeyInTimeZone(new Date(latestCompleted.completedAt), DEFAULT_RECURRENCE_TZ);
            }
          }

          let nextKey = getNextInstanceDateKey({
            pattern: pattern as any,
            interval,
            baseDate: getEndOfDayUtcFromDateKey(baseKey, DEFAULT_RECURRENCE_TZ),
            timeZone: DEFAULT_RECURRENCE_TZ,
          });

          let guard = 0;
          while (nextKey < todayKey && guard < 400) {
            guard++;
            nextKey = getNextInstanceDateKey({
              pattern: pattern as any,
              interval,
              baseDate: getEndOfDayUtcFromDateKey(nextKey, DEFAULT_RECURRENCE_TZ),
              timeZone: DEFAULT_RECURRENCE_TZ,
            });
          }

          targetKey = nextKey;
        }

        // If already exists (any status) for this series + targetKey, skip
        const [existing] = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.recurrenceSeriesId, seriesId), eq(tasks.recurrenceInstanceDate, targetKey)))
          .limit(1);
        if (existing) {
          skipped++;
          continue;
        }

        // Ensure at least one task in the series has recurrenceSeriesId/recurrenceInstanceDate (for future stability)
        if (!(template as any).recurrenceSeriesId || !(template as any).recurrenceInstanceDate) {
          seriesUpdated++;
          if (!dryRun) {
            try {
              const base = template.dueDate || template.completedAt || template.createdAt || now;
              const instKey = getDateKeyInTimeZone(new Date(base), DEFAULT_RECURRENCE_TZ);
              await db
                .update(tasks)
                .set({ recurrenceSeriesId: seriesId, recurrenceInstanceDate: instKey } as any)
                .where(eq(tasks.id, template.id));
            } catch {
              // ignore
            }
          }
        }

        // Create the "current" To Do instance
        const dueDateUtc = getEndOfDayUtcFromDateKey(targetKey, DEFAULT_RECURRENCE_TZ);
        const oldChecklist = (template.checklist || []) as any[];
        const resetChecklist = Array.isArray(oldChecklist) ? oldChecklist.map((i) => ({ ...i, completed: false })) : [];

        if (!dryRun) {
          try {
            await db.insert(tasks).values({
              campaignId: template.campaignId ?? null,
              clientId: template.clientId ?? null,
              assignedToId: template.assignedToId ?? null,
              spaceId: template.spaceId ?? null,
              title: template.title,
              description: template.description ?? null,
              status: "todo",
              priority: template.priority ?? "normal",
              dueDate: dueDateUtc,
              completedAt: null,
              isRecurring: true,
              recurringPattern: pattern,
              recurringInterval: interval,
              recurringEndDate: template.recurringEndDate ?? null,
              scheduleFrom,
              checklist: resetChecklist,
              recurrenceSeriesId: seriesId,
              recurrenceInstanceDate: targetKey,
            } as any);
            tasksCreated++;
          } catch (e: any) {
            // Unique constraint protects us from duplicates
            if (String(e?.code) !== "23505") throw e;
          }
        } else {
          tasksCreated++;
        }
      }

      return res.json({
        success: true,
        dryRun,
        todayKey,
        seriesProcessed,
        seriesUpdated,
        tasksCreated,
        skipped,
      });
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
        const assignee = await storage.getUser(String(task.assignedToId));
        if (assignee?.email) {
          const { emailNotifications } = await import('../emailService');
          const assigneeName = assignee.firstName || assignee.username || 'there';
          
          // Respect preferences
          const prefs = await storage.getUserNotificationPreferences(assignee.id);
          if (prefs?.emailNotifications !== false && prefs?.taskUpdates !== false) {
            void emailNotifications.sendTaskAssignedEmail(
              assigneeName,
              assignee.email,
              task.title,
              task.description || '',
              task.priority || 'normal',
              task.dueDate ? task.dueDate.toISOString() : null,
              creatorName
            ).catch(err => console.error('Failed to send task assignment email:', err));
          }
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
        
        void sendPushToUser(teamMember.id, {
          title: '📋 New Task Created',
          body: `${creatorName} created: "${task.title}"`,
          url: `/tasks?taskId=${task.id}`,
        }).catch(err => console.error('Failed to send push notification:', err));

        // Email notification for team members
        if (teamMember.email) {
          try {
            const { emailNotifications } = await import('../emailService');
            const prefs = await storage.getUserNotificationPreferences(teamMember.id).catch(() => null);
            if (prefs?.emailNotifications !== false && prefs?.taskUpdates !== false) {
              const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
              void emailNotifications.sendActionAlertEmail(
                teamMember.email,
                '📋 New Task Created',
                `${creatorName} created a new task: "${task.title}"`,
                `${appUrl}/tasks?taskId=${task.id}`,
                'info'
              ).catch(err => console.error(`Failed to send task creation email to ${teamMember.username}:`, err));
            }
          } catch (e) {
            console.error('Email error in task creation:', e);
          }
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

