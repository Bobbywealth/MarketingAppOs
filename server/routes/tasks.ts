import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { tasks, taskSpaces, taskComments, taskTemplates, taskDependencies, taskActivity, taskAttachments, taskAnalyticsSnapshot, savedTaskSearches } from "@shared/schema";
import { rolePermissions } from "../rbac";
import { UserRole } from "@shared/roles";
import { eq, and, sql, desc } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requireRole, requirePermission } from "../rbac";
import {
  getCurrentUserContext
} from "./utils";
import {
  handleValidationError,
  notifyAdminsAboutAction
} from "./common";
import { insertTaskSchema, insertTaskSpaceSchema, insertTaskCommentSchema, insertTaskTemplateSchema } from "@shared/schema";
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
router.get("/task-spaces", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
    const userId = user?.id ? Number(user.id) : null;
    
    // DEBUG: Log spaces fetch
    console.log(`📋 Spaces fetch for user: id=${userId}, role=${normalizedRole}`);

    // Admin and Managers see all spaces
    const isAllAccess = normalizedRole === "admin" || normalizedRole === "manager" || normalizedRole === "creator_manager";
    
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

// ============================================
// BULK OPERATIONS
// ============================================

// Bulk update tasks
router.patch("/tasks/bulk", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const { taskIds, updates } = req.body;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "taskIds must be a non-empty array" });
    }
    
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ message: "updates object is required" });
    }
    
    // Validate updates against schema
    const validatedUpdates = insertTaskSchema.partial().strip().parse(updates) as any;
    
    // Handle status changes
    if (validatedUpdates.status === "completed") {
      validatedUpdates.completedAt = new Date();
    } else if (validatedUpdates.status && validatedUpdates.status !== "completed") {
      validatedUpdates.completedAt = null;
    }
    
    // Add updated timestamp
    validatedUpdates.updatedAt = new Date();
    
    // Perform bulk update
    const results = await db
      .update(tasks)
      .set(validatedUpdates)
      .where(sql`${tasks.id} IN ${sql.raw(`(${taskIds.map(id => `'${id}'`).join(',')})`)}`)
      .returning();
    
    res.json({
      success: true,
      updated: results.length,
      tasks: results,
    });
  } catch (error: any) {
    console.error("Bulk update error:", error);
    handleValidationError(error, res);
  }
});

// Bulk delete tasks
router.delete("/tasks/bulk", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "taskIds must be a non-empty array" });
    }
    
    // Delete task comments first (cascade)
    await db.delete(taskComments).where(sql`${taskComments.taskId} IN ${sql.raw(`(${taskIds.map(id => `'${id}'`).join(',')})`)}`);
    
    // Delete task dependencies
    await db.delete(taskDependencies).where(sql`${taskDependencies.taskId} IN ${sql.raw(`(${taskIds.map(id => `'${id}'`).join(',')})`)}`);
    
    // Delete task attachments
    await db.delete(taskAttachments).where(sql`${taskAttachments.taskId} IN ${sql.raw(`(${taskIds.map(id => `'${id}'`).join(',')})`)}`);
    
    // Delete the tasks
    const result = await db
      .delete(tasks)
      .where(sql`${tasks.id} IN ${sql.raw(`(${taskIds.map(id => `'${id}'`).join(',')})`)}`)
      .returning({ id: tasks.id });
    
    res.json({
      success: true,
      deleted: result.length,
    });
  } catch (error: any) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ message: "Failed to delete tasks", error: error.message });
  }
});

// Duplicate tasks
router.post("/tasks/duplicate", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    const user = req.user as any;
    const userId = user?.id ? Number(user.id) : null;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "taskIds must be a non-empty array" });
    }
    
    // Fetch original tasks
    const originalTasks = await db
      .select()
      .from(tasks)
      .where(sql`${tasks.id} IN ${sql.raw(`(${taskIds.map(id => `'${id}'`).join(',')})`)}`);
    
    if (originalTasks.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }
    
    // Create duplicates
    const duplicatedTasks = originalTasks.map(original => ({
      campaignId: original.campaignId,
      clientId: original.clientId,
      assignedToId: original.assignedToId,
      spaceId: original.spaceId,
      title: `${original.title} (Copy)`,
      description: original.description,
      status: "todo" as const, // Reset to todo
      priority: original.priority,
      dueDate: original.dueDate,
      checklist: original.checklist || [],
      tags: original.tags || [],
      isRecurring: false, // Don't duplicate recurring settings
      recurringPattern: null,
      recurringInterval: null,
      recurringEndDate: null,
      scheduleFrom: null,
      createdBy: userId,
    }));
    
    // Insert duplicates
    const inserted = await db.insert(tasks).values(duplicatedTasks).returning();
    
    res.json({
      success: true,
      count: inserted.length,
      tasks: inserted,
    });
  } catch (error: any) {
    console.error("Duplicate tasks error:", error);
    res.status(500).json({ message: "Failed to duplicate tasks", error: error.message });
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

// Task Templates routes

// GET /api/tasks/templates - Get all task templates
router.get("/templates", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?.id ? Number(user.id) : null;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();

    // Admin and Managers see all templates, others see only their own + system templates
    const isAllAccess = normalizedRole === "admin" || normalizedRole === "manager" || normalizedRole === "creator_manager";

    let templates;
    if (isAllAccess) {
      templates = await db.select().from(taskTemplates).orderBy(taskTemplates.createdAt);
    } else {
      templates = await db.select().from(taskTemplates).where(
        eq(taskTemplates.isSystemTemplate, true)
      );
      
      // Add user's own templates
      if (userId) {
        const userTemplates = await db.select().from(taskTemplates).where(
          eq(taskTemplates.createdBy, userId)
        );
        templates = [...templates, ...userTemplates];
      }
    }

    res.json(templates);
  } catch (error) {
    console.error("Error fetching task templates:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

// GET /api/tasks/templates/:id - Get a single task template
router.get("/templates/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id)).limit(1);

    if (!template || template.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template[0]);
  } catch (error) {
    console.error("Error fetching task template:", error);
    res.status(500).json({ message: "Failed to fetch template" });
  }
});

// POST /api/tasks/templates - Create a new task template
router.post("/templates", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?.id ? Number(user.id) : null;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = insertTaskTemplateSchema.parse({
      ...req.body,
      createdBy: userId,
      isSystemTemplate: false, // Only system templates can be created via migration
    });

    const template = await db.insert(taskTemplates).values(validatedData).returning();

    res.status(201).json(template[0]);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating task template:", error);
    res.status(500).json({ message: "Failed to create template" });
  }
});

// PATCH /api/tasks/templates/:id - Update a task template
router.patch("/templates/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    const userId = user?.id ? Number(user.id) : null;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();

    // Check if template exists and user has permission
    const existingTemplate = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id)).limit(1);
    
    if (!existingTemplate || existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }

    const template = existingTemplate[0];

    // Only admins can modify system templates, others can only modify their own
    if (template.isSystemTemplate && normalizedRole !== "admin") {
      return res.status(403).json({ message: "Cannot modify system templates" });
    }

    if (!template.isSystemTemplate && template.createdBy !== userId) {
      return res.status(403).json({ message: "You can only modify your own templates" });
    }

    const updatedTemplate = await db.update(taskTemplates)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(taskTemplates.id, id))
      .returning();

    res.json(updatedTemplate[0]);
  } catch (error) {
    console.error("Error updating task template:", error);
    res.status(500).json({ message: "Failed to update template" });
  }
});

// DELETE /api/tasks/templates/:id - Delete a task template
router.delete("/templates/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    const userId = user?.id ? Number(user.id) : null;
    const normalizedRole = String(user?.role ?? "").trim().toLowerCase();

    // Check if template exists and user has permission
    const existingTemplate = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id)).limit(1);
    
    if (!existingTemplate || existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }

    const template = existingTemplate[0];

    // Only admins can delete system templates, others can only delete their own
    if (template.isSystemTemplate && normalizedRole !== "admin") {
      return res.status(403).json({ message: "Cannot delete system templates" });
    }

    if (!template.isSystemTemplate && template.createdBy !== userId) {
      return res.status(403).json({ message: "You can only delete your own templates" });
    }

    await db.delete(taskTemplates).where(eq(taskTemplates.id, id));

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task template:", error);
    res.status(500).json({ message: "Failed to delete template" });
  }
});

// ==================== TASK DEPENDENCIES ====================

// Get dependencies for a task
router.get("/tasks/:taskId/dependencies", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const dependencies = await storage.getTaskDependencies(req.params.taskId);
    
    // Get prerequisite task details
    const tasks = await Promise.all(
      dependencies.map(async (dep) => {
        const prerequisiteTask = await storage.getTask(dep.prerequisiteTaskId);
        return {
          ...dep,
          prerequisiteTask,
        };
      })
    );
    
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching task dependencies:", error);
    res.status(500).json({ message: "Failed to fetch dependencies" });
  }
});

// Get tasks that depend on this task
router.get("/tasks/:taskId/dependents", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const dependents = await storage.getDependentTasks(req.params.taskId);
    
    // Get dependent task details
    const tasks = await Promise.all(
      dependents.map(async (dep) => {
        const dependentTask = await storage.getTask(dep.taskId);
        return {
          ...dep,
          dependentTask,
        };
      })
    );
    
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching dependent tasks:", error);
    res.status(500).json({ message: "Failed to fetch dependents" });
  }
});

// Add a dependency
router.post("/tasks/:taskId/dependencies", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { prerequisiteTaskId, dependencyType } = req.body;
    
    // Validate that prerequisite task exists
    const prerequisiteTask = await storage.getTask(prerequisiteTaskId);
    if (!prerequisiteTask) {
      return res.status(404).json({ message: "Prerequisite task not found" });
    }
    
    // Check for circular dependencies
    const validation = await storage.validateTaskDependencies(prerequisiteTaskId);
    if (!validation.valid && validation.blockedBy.some(t => t.id === req.params.taskId)) {
      return res.status(400).json({ message: "Cannot create dependency - would cause circular reference" });
    }
    
    const dependency = await storage.createTaskDependency({
      taskId: req.params.taskId,
      prerequisiteTaskId,
      dependencyType: dependencyType || "finish_to_start",
    });
    
    // Log activity
    await storage.createTaskActivity({
      taskId: req.params.taskId,
      userId: user?.id ? Number(user.id) : undefined,
      action: "dependency_added",
      fieldName: "dependency",
      newValue: `Added dependency on: ${prerequisiteTask.title}`,
    });
    
    res.status(201).json({ ...dependency, prerequisiteTask });
  } catch (error) {
    console.error("Error creating task dependency:", error);
    res.status(500).json({ message: "Failed to create dependency" });
  }
});

// Remove a dependency
router.delete("/tasks/:taskId/dependencies/:depId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const dependency = await storage.getTaskDependencies(req.params.taskId);
    const dep = dependency.find(d => d.id === req.params.depId);
    
    if (dep) {
      const prerequisiteTask = await storage.getTask(dep.prerequisiteTaskId);
      
      await storage.deleteTaskDependency(req.params.depId);
      
      // Log activity
      await storage.createTaskActivity({
        taskId: req.params.taskId,
        userId: user?.id ? Number(user.id) : undefined,
        action: "dependency_removed",
        fieldName: "dependency",
        oldValue: `Removed dependency on: ${prerequisiteTask?.title || dep.prerequisiteTaskId}`,
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task dependency:", error);
    res.status(500).json({ message: "Failed to delete dependency" });
  }
});

// Validate if task can be started (dependencies completed)
router.get("/tasks/:taskId/validate-dependencies", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const validation = await storage.validateTaskDependencies(req.params.taskId);
    res.json(validation);
  } catch (error) {
    console.error("Error validating task dependencies:", error);
    res.status(500).json({ message: "Failed to validate dependencies" });
  }
});

// ==================== TASK ACTIVITY ====================

// Get activity history for a task
router.get("/tasks/:taskId/activity", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activity = await storage.getTaskActivity(req.params.taskId, limit);
    
    // Get user details for each activity
    const activities = await Promise.all(
      activity.map(async (a) => {
        const user = a.userId ? await storage.getUser(String(a.userId)) : null;
        return {
          ...a,
          user,
        };
      })
    );
    
    res.json(activities);
  } catch (error) {
    console.error("Error fetching task activity:", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
});

// Get user's activity feed
router.get("/users/:userId/activity", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 100;
    const activity = await storage.getUserActivity(userId, limit);
    
    // Get task and user details
    const activities = await Promise.all(
      activity.map(async (a) => {
        const task = await storage.getTask(a.taskId);
        const user = a.userId ? await storage.getUser(String(a.userId)) : null;
        return {
          ...a,
          task,
          user,
        };
      })
    );
    
    res.json(activities);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
});

// ==================== TASK ATTACHMENTS ====================

// Get attachments for a task
router.get("/tasks/:taskId/attachments", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const attachments = await storage.getTaskAttachments(req.params.taskId);
    
    // Get uploader details
    const attachmentsWithUploader = await Promise.all(
      attachments.map(async (a) => {
        const uploader = await storage.getUser(String(a.uploadedBy));
        return {
          ...a,
          uploader,
        };
      })
    );
    
    res.json(attachmentsWithUploader);
  } catch (error) {
    console.error("Error fetching task attachments:", error);
    res.status(500).json({ message: "Failed to fetch attachments" });
  }
});

// Create attachment (stub - actual upload handled by multer)
router.post("/tasks/:taskId/attachments", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { fileName, fileSize, fileType, objectPath } = req.body;
    
    const attachment = await storage.createTaskAttachment({
      taskId: req.params.taskId,
      uploadedBy: user?.id ? Number(user.id) : 1,
      fileName,
      fileSize,
      fileType,
      objectPath,
    });
    
    // Log activity
    await storage.createTaskActivity({
      taskId: req.params.taskId,
      userId: user?.id ? Number(user.id) : undefined,
      action: "attachment_added",
      fieldName: "attachment",
      newValue: `Added file: ${fileName}`,
    });
    
    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error creating task attachment:", error);
    res.status(500).json({ message: "Failed to create attachment" });
  }
});

// Delete attachment
router.delete("/tasks/:taskId/attachments/:attId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const attachment = await storage.getTaskAttachments(req.params.taskId);
    const att = attachment.find(a => a.id === req.params.attId);
    
    if (att) {
      await storage.createTaskActivity({
        taskId: req.params.taskId,
        userId: user?.id ? Number(user.id) : undefined,
        action: "attachment_removed",
        fieldName: "attachment",
        oldValue: `Removed file: ${att.fileName}`,
      });
    }
    
    await storage.deleteTaskAttachment(req.params.attId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task attachment:", error);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
});

// ==================== WORKLOAD ====================

// Get user workload
router.get("/users/:userId/workload", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const workload = await storage.getUserWorkload(userId);
    res.json(workload);
  } catch (error) {
    console.error("Error fetching user workload:", error);
    res.status(500).json({ message: "Failed to fetch workload" });
  }
});

// ==================== ANALYTICS ====================

// Get task analytics
router.get("/tasks/analytics", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
    
    const analytics = await storage.getTaskAnalytics(dateFrom, dateTo);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching task analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// ==================== ADVANCED SEARCH ====================

// Advanced task search
router.get("/tasks/search", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status ? (req.query.status as string).split(",") : undefined,
      priority: req.query.priority ? (req.query.priority as string).split(",") : undefined,
      assigneeId: req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined,
      spaceId: req.query.spaceId as string | undefined,
      clientId: req.query.clientId as string | undefined,
      dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
      dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
      searchText: req.query.q as string | undefined,
    };
    
    const tasks = await storage.searchTasks(filters);
    res.json(tasks);
  } catch (error) {
    console.error("Error searching tasks:", error);
    res.status(500).json({ message: "Failed to search tasks" });
  }
});

// ==================== SAVED SEARCHES ====================

// Get saved searches for user
router.get("/tasks/searches/saved", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?.id ? Number(user.id) : 0;
    const searches = await storage.getSavedTaskSearches(userId);
    res.json(searches);
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    res.status(500).json({ message: "Failed to fetch saved searches" });
  }
});

// Save a search
router.post("/tasks/searches/saved", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { name, filters } = req.body;
    
    const search = await storage.saveTaskSearch({
      userId: user?.id ? Number(user.id) : 1,
      name,
      filters,
      isDefault: false,
    });
    
    res.status(201).json(search);
  } catch (error) {
    console.error("Error saving search:", error);
    res.status(500).json({ message: "Failed to save search" });
  }
});

// Delete a saved search
router.delete("/tasks/searches/saved/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    await storage.deleteSavedTaskSearch(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting saved search:", error);
    res.status(500).json({ message: "Failed to delete saved search" });
  }
});

export default router;

